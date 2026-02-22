from flask import Flask, jsonify, make_response, request, send_from_directory
import pandas as pd
from pathlib import Path
import sys
import random
import logging
from datetime import datetime, timedelta

# Add parent directory to path so backend can be imported
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.training.training_decision import decide_training_actions
from backend.config import COLLECTOR_DB_PATH, COLLECTOR_API_KEY
from backend.collector.event_store import EventStore

logger = logging.getLogger(__name__)

app = Flask(__name__)

DATA_DIR = Path(__file__).resolve().parent / "data"
FINAL_CSV = DATA_DIR / "final_risk_scores.csv"
STATIC_DIR = Path(__file__).resolve().parent / "static"

# Initialize the event store (SQLite-backed)
_event_store = EventStore(db_path=str(COLLECTOR_DB_PATH))


# Phishing email templates based on behavior patterns
PHISHING_TEMPLATES = {
    "credential_harvest": [
        {
            "subject": "Action Required: Verify Your Account Security",
            "preview": "Click here to verify your credentials and secure your account...",
            "body": "Dear {{name}},\n\nWe detected unusual login activity on your account. Please verify your credentials immediately by clicking the link below.\n\nYour account may be compromised. Click to verify: {{link}}\n\nRegards,\nSecurity Team"
        },
        {
            "subject": "Urgent: Update Your Password",
            "preview": "Your password expires in 24 hours. Update now to maintain access...",
            "body": "{{name}},\n\nYour password will expire in 24 hours. To maintain access to company resources, please update it now.\n\nUpdate Password: {{link}}\n\nDo not reply to this email."
        }
    ],
    "malware_delivery": [
        {
            "subject": "Important Document: Q4 Budget Review",
            "preview": "Please review the attached Q4 budget document...",
            "body": "Hi {{name}},\n\nPlease find attached the Q4 budget review. Action required by end of day.\n\nOpen Document: {{link}}\n\nThanks"
        },
        {
            "subject": "Invoice for Approval",
            "preview": "New invoice requires your approval {{amount}}...",
            "body": "{{name}},\n\nNew invoice {{amount}} requires your approval. Please review and approve: {{link}}\n\nThanks,\nFinance Team"
        }
    ],
    "social_engineering": [
        {
            "subject": "Congratulations! You've Won a Prize",
            "preview": "Claim your prize before it expires...",
            "body": "{{name}},\n\nCongratulations! You've won a {{prize}}. Click below to claim it:\n{{link}}\n\nOffer expires in 24 hours!"
        },
        {
            "subject": "Your Package Delivery Failed",
            "preview": "Failed delivery attempt. Reschedule here...",
            "body": "We attempted to deliver your package but you were not home. Reschedule delivery: {{link}}"
        }
    ]
}

# Behavioral attributes that increase phishing susceptibility
BEHAVIORAL_FACTORS = {
    "high_email_volume": 0.8,
    "frequent_downloads": 0.7,
    "password_reuse": 0.9,
    "late_night_access": 0.6,
    "rapid_clicking": 0.75,
    "admin_privileges": 0.95,
    "c_suite": 0.9,
}


def _tier_from_score(s: float) -> str:
    if s >= 0.6:
        return "High"
    if s >= 0.3:
        return "Medium"
    return "Low"


def _cors_json(data):
    resp = make_response(jsonify(data))
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-API-Key"
    return resp


def _validate_api_key() -> bool:
    """Validate the API key from the request header.
    Returns True if valid or if no key is configured (dev mode)."""
    if not COLLECTOR_API_KEY:
        return True  # Dev mode — no key required
    provided = request.headers.get("X-API-Key", "")
    return provided == COLLECTOR_API_KEY


@app.after_request
def after_request(response):
    """Add CORS headers to all responses."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-API-Key"
    return response


# ============ EXISTING ENDPOINTS ============

@app.route("/api/health", methods=["GET", "OPTIONS"])
def health():
    """Health check endpoint."""
    collector_stats = _event_store.get_event_stats()
    return _cors_json({
        "status": "ok",
        "service": "behaviour-adaptive-spear-phishing-backend",
        "collector": {
            "active": True,
            "total_events": collector_stats["total_events"],
            "unique_users": collector_stats["unique_users"],
        },
        "timestamp": datetime.utcnow().isoformat(),
    })


@app.route("/api/risk-summary")
def risk_summary():
    if not FINAL_CSV.exists():
        return _cors_json({"error": "data not available"}), 500

    df = pd.read_csv(FINAL_CSV)
    if "final_risk_score" not in df.columns:
        return _cors_json({"error": "unexpected CSV format"}), 500

    df2 = df.copy()
    df2["tier"] = df2["final_risk_score"].apply(_tier_from_score)
    df2["reason_tags"] = df2.get("risk_reason", "").astype(str).apply(lambda s: [t.strip() for t in s.split(";") if t.strip()])

    actions = decide_training_actions(pd.DataFrame({"user": df2["user"].values, "risk_score": df2["final_risk_score"].values}))
    df2["training_action"] = actions["training_action"].values

    payload = []
    for _, r in df2.iterrows():
        payload.append(
            {
                "user": r["user"],
                "risk_score": float(r["final_risk_score"]),
                "tier": r["tier"],
                "reason_tags": r["reason_tags"],
                "action_taken": "Training triggered" if r["training_action"] in ("MICRO", "MANDATORY") else "No action",
            }
        )

    return _cors_json({"data": payload})


@app.route("/api/training-status")
def training_status():
    if not FINAL_CSV.exists():
        return _cors_json({"error": "data not available"}), 500

    df = pd.read_csv(FINAL_CSV)
    actions = decide_training_actions(pd.DataFrame({"user": df["user"].values, "risk_score": df["final_risk_score"].values}))

    payload = []
    for _, r in actions.iterrows():
        payload.append(
            {
                "user": r["user"],
                "training_action": r["training_action"],
                "micro_training_url": r.get("micro_training_url", ""),
                "mandatory_training_url": r.get("mandatory_training_url", ""),
            }
        )

    return _cors_json({"data": payload})


@app.route("/api/phishing-simulation", methods=["GET", "OPTIONS"])
def phishing_simulation():
    """Generate personalized phishing emails based on behavioral patterns"""
    if not FINAL_CSV.exists():
        return _cors_json({"error": "data not available"}), 500

    df = pd.read_csv(FINAL_CSV)
    df2 = df.copy()
    df2["risk_score"] = df2.get("final_risk_score", 0)
    df2["tier"] = df2["risk_score"].apply(_tier_from_score)

    campaigns = []
    for _, user_row in df2.iterrows():
        user_name = user_row.get("user", "Unknown")
        risk_score = float(user_row.get("risk_score", 0))

        if risk_score > 0.7:
            phishing_type = "credential_harvest"
        elif risk_score > 0.4:
            phishing_type = "malware_delivery"
        else:
            phishing_type = "social_engineering"

        templates = PHISHING_TEMPLATES.get(phishing_type, [])
        if templates:
            template = random.choice(templates)
            campaigns.append({
                "user": user_name,
                "risk_score": risk_score,
                "phishing_type": phishing_type,
                "email": {
                    "subject": template["subject"].replace("{{name}}", user_name.split()[0] if user_name else "User"),
                    "preview": template["preview"],
                    "body": template["body"].replace("{{name}}", user_name).replace("{{link}}", "https://verify-login.local/auth"),
                    "from": "security-alerts@company-domain.com",
                    "timestamp": datetime.now().isoformat()
                },
                "susceptibility": min(1.0, risk_score * 1.2),
                "predicted_click_rate": min(1.0, risk_score * 0.8)
            })

    return _cors_json({"campaigns": campaigns})


@app.route("/api/simulation-results", methods=["POST", "OPTIONS"])
def simulation_results():
    """Record phishing simulation results"""
    if request.method == "OPTIONS":
        return _cors_json({"ok": True})

    data = request.get_json()
    user = data.get("user")
    clicked = data.get("clicked", False)
    timestamp = datetime.now().isoformat()

    return _cors_json({
        "user": user,
        "clicked": clicked,
        "timestamp": timestamp,
        "feedback": "Great job! You didn't fall for the phishing email." if not clicked else "Be more careful with emails from unknown senders."
    })


@app.route("/api/behavioral-analytics", methods=["GET", "OPTIONS"])
def behavioral_analytics():
    """Get behavioral analytics and risk factors"""
    if not FINAL_CSV.exists():
        return _cors_json({"error": "data not available"}), 500

    df = pd.read_csv(FINAL_CSV)

    analytics = {
        "total_users": len(df),
        "high_risk_users": len(df[df.get("final_risk_score", 0) >= 0.6]),
        "medium_risk_users": len(df[(df.get("final_risk_score", 0) >= 0.3) & (df.get("final_risk_score", 0) < 0.6)]),
        "low_risk_users": len(df[df.get("final_risk_score", 0) < 0.3]),
        "avg_risk_score": float(df.get("final_risk_score", 0).mean()),
        "behavioral_factors": BEHAVIORAL_FACTORS,
        "isolation_forest_score": float(df.get("final_risk_score", 0).mean()),
        "last_updated": datetime.now().isoformat()
    }

    return _cors_json(analytics)


# ============ COLLECTOR ENDPOINTS ============

@app.route("/api/collect", methods=["POST", "OPTIONS"])
def collect_events():
    """Webhook endpoint to receive behavioral events from the browser collector.

    Accepts a JSON payload:
    {
        "user_id": "employee_123",
        "session_id": "sess_abc123",
        "events": [
            {"type": "page_view", "url": "/dashboard", "timestamp": "...", "data": {}},
            {"type": "click", "data": {"target": {...}}, "timestamp": "..."}
        ]
    }

    Security: Validates X-API-Key header when COLLECTOR_API_KEY is configured.
    """
    if request.method == "OPTIONS":
        return _cors_json({"ok": True})

    # Validate API key
    if not _validate_api_key():
        return _cors_json({"error": "Invalid or missing API key"}), 401

    data = request.get_json(silent=True)
    if not data:
        return _cors_json({"error": "Invalid JSON payload"}), 400

    user_id = data.get("user_id", "").strip()
    session_id = data.get("session_id", "").strip()
    events = data.get("events", [])

    if not user_id:
        return _cors_json({"error": "user_id is required"}), 400
    if not session_id:
        return _cors_json({"error": "session_id is required"}), 400
    if not events or not isinstance(events, list):
        return _cors_json({"error": "events must be a non-empty array"}), 400
    if len(events) > 100:
        return _cors_json({"error": "Maximum 100 events per request"}), 400

    # Extract client metadata
    ip_address = request.remote_addr or ""
    user_agent = request.headers.get("User-Agent", "")[:200]

    try:
        count = _event_store.insert_events(
            user_id=user_id,
            session_id=session_id,
            events=events,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        return _cors_json({
            "status": "ok",
            "events_received": count,
            "user_id": user_id,
            "session_id": session_id,
        })
    except Exception as exc:
        logger.error("Failed to insert events: %s", exc)
        return _cors_json({"error": "Failed to store events"}), 500


@app.route("/api/events", methods=["GET", "OPTIONS"])
def query_events():
    """Query collected behavioral events with optional filters.

    Query params:
      - user_id: filter by user
      - event_type: filter by event type
      - since: ISO timestamp to filter events after
      - limit: max results (default 200, max 1000)
    """
    if request.method == "OPTIONS":
        return _cors_json({"ok": True})

    user_id = request.args.get("user_id")
    event_type = request.args.get("event_type")
    since = request.args.get("since")
    limit = min(int(request.args.get("limit", 200)), 1000)

    try:
        events = _event_store.get_events(
            user_id=user_id,
            event_type=event_type,
            since=since,
            limit=limit,
        )
        return _cors_json({
            "data": events,
            "count": len(events),
            "filters": {
                "user_id": user_id,
                "event_type": event_type,
                "since": since,
                "limit": limit,
            },
        })
    except Exception as exc:
        logger.error("Failed to query events: %s", exc)
        return _cors_json({"error": "Failed to query events"}), 500


@app.route("/api/events/stats", methods=["GET", "OPTIONS"])
def event_stats():
    """Get aggregated statistics about collected events."""
    if request.method == "OPTIONS":
        return _cors_json({"ok": True})

    try:
        stats = _event_store.get_event_stats()
        pipeline_runs = _event_store.get_pipeline_runs(limit=5)
        stats["recent_pipeline_runs"] = pipeline_runs
        return _cors_json(stats)
    except Exception as exc:
        logger.error("Failed to get event stats: %s", exc)
        return _cors_json({"error": "Failed to get stats"}), 500


@app.route("/api/pipeline/run", methods=["POST", "OPTIONS"])
def run_pipeline_from_collected():
    """Trigger the anomaly detection pipeline using collected behavioral data.

    Converts collected events to auth-format, runs feature extraction,
    Isolation Forest, and risk scoring. Updates final_risk_scores.csv.
    """
    if request.method == "OPTIONS":
        return _cors_json({"ok": True})

    try:
        # Export events to auth format
        auth_df = _event_store.export_to_auth_format()

        if auth_df.empty:
            return _cors_json({
                "status": "no_data",
                "message": "No behavioral events collected yet. Embed the collector script to start gathering data.",
            }), 400

        user_count = auth_df["user"].nunique()
        event_count = len(auth_df)

        # Record pipeline start
        run_id = _event_store.record_pipeline_start(event_count, user_count)

        # Import pipeline components
        from backend.features.feature_extractor import extract_user_features
        from backend.models.isolation_forest import run_isolation_forest
        from backend.scoring.risk_score import compute_risk_score

        # Step 1: Extract features
        features = extract_user_features(auth_df)

        if features.empty:
            _event_store.record_pipeline_finish(run_id, "failed", "No features extracted")
            return _cors_json({"status": "error", "message": "No features could be extracted from collected data"}), 500

        # Step 2: Run Isolation Forest
        anomalies = run_isolation_forest(features)

        # Step 3: Compute risk scores
        results = compute_risk_score(anomalies)

        # Save results
        if results.index.name is None:
            if "user" in results.columns:
                out_df = results.reset_index(drop=True)
            else:
                out_df = results.reset_index()
        else:
            out_df = results.reset_index()

        out_df.to_csv(FINAL_CSV, index=False)

        # Record pipeline complete
        _event_store.record_pipeline_finish(run_id, "completed")

        return _cors_json({
            "status": "completed",
            "run_id": run_id,
            "events_processed": event_count,
            "users_analyzed": user_count,
            "high_risk_users": len(out_df[out_df["final_risk_score"] >= 0.6]) if "final_risk_score" in out_df.columns else 0,
            "output_file": str(FINAL_CSV),
            "timestamp": datetime.utcnow().isoformat(),
        })

    except Exception as exc:
        logger.error("Pipeline run failed: %s", exc, exc_info=True)
        try:
            _event_store.record_pipeline_finish(run_id, "failed", str(exc))
        except Exception:
            pass
        return _cors_json({"status": "error", "message": str(exc)}), 500


@app.route("/api/collector/script.js", methods=["GET"])
def serve_collector_script():
    """Serve the browser collector JavaScript file."""
    script_path = STATIC_DIR / "collector.js"
    if not script_path.exists():
        return _cors_json({"error": "Collector script not found"}), 404

    resp = make_response(script_path.read_text())
    resp.headers["Content-Type"] = "application/javascript"
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Cache-Control"] = "public, max-age=3600"
    return resp


# ============ UNIFIED DASHBOARD ENDPOINT ============

@app.route("/api/dashboard", methods=["GET", "OPTIONS"])
def dashboard_data():
    """Unified endpoint returning all real data for the dashboard.

    Aggregates from final_risk_scores.csv, event store, and training decisions
    to provide a single response powering all dashboard components.
    """
    if request.method == "OPTIONS":
        return _cors_json({"ok": True})

    try:
        # ── Risk data from pipeline output ──
        users = []
        risk_distribution = {"high": 0, "medium": 0, "low": 0}
        total_risk = 0.0
        avg_risk = 0.0

        if FINAL_CSV.exists():
            df = pd.read_csv(FINAL_CSV)
            if "final_risk_score" in df.columns:
                for _, row in df.iterrows():
                    score = float(row.get("final_risk_score", 0))
                    tier = _tier_from_score(score)
                    risk_distribution[tier.lower()] += 1
                    total_risk += score

                    users.append({
                        "user_id": row.get("user", "unknown"),
                        "risk_score": round(score, 4),
                        "tier": tier,
                        "risk_reason": row.get("risk_reason", ""),
                        "login_count": int(row.get("login_count", 0)),
                        "failed_login_ratio": round(float(row.get("failed_login_ratio", 0)), 4),
                        "anomaly_score": round(float(row.get("anomaly_score", 0)), 4),
                        "ml_anomaly_score": round(float(row.get("ml_anomaly_score", 0)), 4),
                    })

                if len(df) > 0:
                    avg_risk = total_risk / len(df)

        total_users = len(users)

        # ── Training decisions ──
        training_data = []
        training_pending = 0
        if users:
            actions_df = decide_training_actions(
                pd.DataFrame({
                    "user": [u["user_id"] for u in users],
                    "risk_score": [u["risk_score"] for u in users],
                })
            )
            for _, row in actions_df.iterrows():
                action = row.get("training_action", "NONE")
                is_pending = action in ("MICRO", "MANDATORY")
                if is_pending:
                    training_pending += 1
                training_data.append({
                    "user_id": row["user"],
                    "training_action": action,
                    "micro_training_url": row.get("micro_training_url", ""),
                    "mandatory_training_url": row.get("mandatory_training_url", ""),
                    "is_pending": is_pending,
                })

        # ── Event collection stats ──
        event_stats = _event_store.get_event_stats()
        pipeline_runs = _event_store.get_pipeline_runs(limit=5)

        # ── Per-user event counts ──
        user_event_counts = {}
        for u in users:
            events = _event_store.get_events(user_id=u["user_id"], limit=1000)
            user_event_counts[u["user_id"]] = len(events)

        # ── Auto-generated alerts from real data ──
        alerts = []
        for u in users:
            if u["tier"] == "High":
                alerts.append({
                    "severity": "high",
                    "title": f"High Risk User Detected: {u['user_id']}",
                    "description": f"{u['user_id']} has a risk score of {u['risk_score']:.2f}. "
                                   f"Reason: {u['risk_reason']}. Recommend immediate intervention.",
                    "action": "Review Profile",
                })
            elif u["tier"] == "Medium" and u.get("failed_login_ratio", 0) > 0.3:
                alerts.append({
                    "severity": "medium",
                    "title": f"Elevated Failed Login Rate: {u['user_id']}",
                    "description": f"{u['user_id']} has {u['failed_login_ratio']:.0%} failed login ratio. "
                                   f"Monitor for potential account compromise.",
                    "action": "Monitor Activity",
                })

        if event_stats["total_events"] == 0:
            alerts.append({
                "severity": "medium",
                "title": "No Behavioral Data Collected",
                "description": "The collector has not received any events yet. "
                               "Deploy the collector script to internal pages to start gathering data.",
                "action": "View Setup Guide",
            })

        # ── Auto-generated recommendations ──
        recommendations = []
        if risk_distribution["high"] > 0:
            recommendations.append({
                "priority": "urgent",
                "title": f"Address {risk_distribution['high']} High-Risk User(s)",
                "description": f"There are {risk_distribution['high']} users flagged as high-risk by the Isolation Forest model. "
                               f"Assign mandatory security training immediately.",
                "impact": f"Could prevent {risk_distribution['high']} potential security breaches",
            })
        if training_pending > 0:
            recommendations.append({
                "priority": "high",
                "title": f"Complete {training_pending} Pending Training(s)",
                "description": f"{training_pending} users have pending training assignments. "
                               f"Follow up to ensure completion within required timeframes.",
                "impact": "Improve overall security posture",
            })
        if total_users > 0 and risk_distribution["medium"] > 0:
            recommendations.append({
                "priority": "medium",
                "title": "Run Phishing Simulations for Medium-Risk Users",
                "description": f"{risk_distribution['medium']} users are in the watchlist category. "
                               f"Run targeted phishing simulations to assess their actual susceptibility.",
                "impact": "Identify users who need targeted intervention",
            })
        if total_users > 0:
            recommendations.append({
                "priority": "medium",
                "title": "Increase Data Collection Coverage",
                "description": "Deploy the behavioral collector to more internal pages to improve "
                               "risk assessment accuracy with broader behavioral data.",
                "impact": "Better behavioral baseline for anomaly detection",
            })

        # ── Overall risk level ──
        if avg_risk >= 0.6:
            overall_risk = "High"
        elif avg_risk >= 0.3:
            overall_risk = "Medium"
        else:
            overall_risk = "Low"

        return _cors_json({
            "posture": {
                "overall_risk_level": overall_risk,
                "total_users": total_users,
                "avg_risk_score": round(avg_risk, 4),
                "training_pending": training_pending,
                "total_events_collected": event_stats["total_events"],
                "last_pipeline_run": pipeline_runs[0]["started_at"] if pipeline_runs else None,
            },
            "risk_distribution": risk_distribution,
            "users": users,
            "user_event_counts": user_event_counts,
            "training": training_data,
            "alerts": alerts,
            "recommendations": recommendations,
            "event_stats": event_stats,
            "pipeline_runs": pipeline_runs,
        })

    except Exception as exc:
        logger.error("Dashboard data failed: %s", exc, exc_info=True)
        return _cors_json({"error": str(exc)}), 500


# ============ ADAPTIVE EMAIL GENERATOR ============

@app.route("/api/generate-email", methods=["POST", "OPTIONS"])
def generate_email():
    """Generate an adaptive spear phishing email tailored to a specific user's
    behavioral profile and a given scenario.

    Request body:
    {
        "user_id": "employee_charlie",
        "scenario": "password reset",    // free text scenario
        "context": "finance department"   // optional extra context
    }

    The generated email adapts to:
    - User's browsing patterns (most visited pages)
    - Typing speed (fast typists get shorter, urgent emails)
    - Click behavior (clickers get more link-heavy emails)
    - Activity timing (match when user is most active)
    - Risk score (higher risk = more sophisticated attack)
    """
    if request.method == "OPTIONS":
        return _cors_json({"ok": True})

    data = request.get_json(silent=True)
    if not data:
        return _cors_json({"error": "Invalid JSON payload"}), 400

    user_id = data.get("user_id", "").strip()
    scenario = data.get("scenario", "credential verification").strip()
    context = data.get("context", "").strip()

    if not user_id:
        return _cors_json({"error": "user_id is required"}), 400

    try:
        # ── Gather user behavioral profile ──
        events = _event_store.get_events(user_id=user_id, limit=500)
        event_count = len(events)

        # Analyze behavioral patterns
        page_views = [e for e in events if e.get("event_type") == "page_view"]
        clicks = [e for e in events if e.get("event_type") == "click"]
        typing_events = [e for e in events if e.get("event_type") == "typing_cadence"]
        copy_events = [e for e in events if e.get("event_type") in ("copy_event", "paste_event")]
        sessions = set(e.get("session_id", "") for e in events)

        # Pages visited
        visited_pages = []
        for pv in page_views:
            url = pv.get("page_url", "")
            if url and url not in visited_pages:
                visited_pages.append(url)

        # Average typing speed
        avg_typing_speed = None
        if typing_events:
            import json as _json
            speeds = []
            for te in typing_events:
                try:
                    td = _json.loads(te.get("event_data", "{}")) if isinstance(te.get("event_data"), str) else te.get("event_data", {})
                    if "avgIntervalMs" in td:
                        speeds.append(td["avgIntervalMs"])
                except Exception:
                    pass
            if speeds:
                avg_typing_speed = sum(speeds) / len(speeds)

        # Risk score from pipeline
        user_risk = None
        user_risk_reason = ""
        if FINAL_CSV.exists():
            df = pd.read_csv(FINAL_CSV)
            user_row = df[df["user"] == user_id]
            if not user_row.empty:
                user_risk = float(user_row.iloc[0].get("final_risk_score", 0))
                user_risk_reason = str(user_row.iloc[0].get("risk_reason", ""))

        # ── Build behavioral profile ──
        profile = {
            "user_id": user_id,
            "total_events": event_count,
            "sessions": len(sessions),
            "pages_visited": visited_pages[:10],
            "total_clicks": len(clicks),
            "total_page_views": len(page_views),
            "copy_paste_events": len(copy_events),
            "avg_typing_speed_ms": round(avg_typing_speed) if avg_typing_speed else None,
            "risk_score": user_risk,
            "risk_reason": user_risk_reason,
        }

        # ── Generate adaptive email ──
        # Adapt email characteristics based on behavioral profile
        is_fast_typist = avg_typing_speed is not None and avg_typing_speed < 100
        is_heavy_clicker = len(clicks) > 10
        is_high_risk = user_risk is not None and user_risk >= 0.6
        is_copy_paster = len(copy_events) > 2
        visits_admin = any("/admin" in p for p in visited_pages)
        visits_settings = any("/settings" in p for p in visited_pages)
        visits_reports = any("/report" in p for p in visited_pages)

        # Scenario-based email generation
        scenario_lower = scenario.lower()

        # Build sender based on context
        if "finance" in context.lower() or "invoice" in scenario_lower:
            sender_name = "Finance Department"
            sender_email = "finance-notifications@company-internal.com"
        elif "hr" in context.lower() or "benefit" in scenario_lower:
            sender_name = "HR Team"
            sender_email = "hr-updates@company-internal.com"
        elif "it" in context.lower() or "password" in scenario_lower or "security" in scenario_lower:
            sender_name = "IT Security Team"
            sender_email = "security-alerts@company-internal.com"
        elif "exec" in context.lower() or "ceo" in scenario_lower:
            sender_name = "Office of the CEO"
            sender_email = "executive-office@company-internal.com"
        else:
            sender_name = "System Administration"
            sender_email = "admin-notifications@company-internal.com"

        # Build subject and body adaptively
        urgency = "URGENT: " if is_high_risk else ""
        time_pressure = "within the next 2 hours" if is_fast_typist else "by end of business today"

        # Generate contextual email body based on scenario
        if "password" in scenario_lower or "credential" in scenario_lower:
            subject = f"{urgency}Action Required: Verify Your Account Credentials"
            body = (
                f"Dear {user_id.replace('_', ' ').title()},\n\n"
                f"Our security monitoring system has detected unusual activity on your account. "
            )
            if visits_admin:
                body += "Specifically, your administrative access privileges require immediate re-verification. "
            if is_high_risk:
                body += "Your account has been flagged for elevated risk behavior. "
            body += (
                f"\n\nTo maintain access to company resources, please verify your credentials "
                f"{time_pressure}.\n\n"
                f"▶ Verify Now: https://company-sso.verify-portal.com/auth?user={user_id}\n\n"
            )
            if is_copy_paster:
                body += "Note: Do NOT copy-paste your credentials from external sources. Use your current password only.\n\n"
            body += (
                f"Failure to verify will result in temporary suspension of your account.\n\n"
                f"Regards,\n{sender_name}"
            )

        elif "invoice" in scenario_lower or "payment" in scenario_lower:
            subject = f"{urgency}Invoice #{random.randint(10000,99999)} Requires Your Approval"
            amount = f"${random.randint(500, 15000):,.2f}"
            body = (
                f"Hi {user_id.replace('_', ' ').title()},\n\n"
                f"A new invoice for {amount} has been submitted and requires your approval "
                f"{time_pressure}.\n\n"
            )
            if visits_reports:
                body += "This invoice is related to the Q4 reports you recently accessed. "
            body += (
                f"\n\n▶ Review Invoice: https://finance-portal.company-internal.com/invoice/review\n\n"
            )
            if is_heavy_clicker:
                body += "Quick Action: Click 'Approve' to process immediately, or 'Review' for full details.\n\n"
            body += f"Thank you,\n{sender_name}"

        elif "meeting" in scenario_lower or "calendar" in scenario_lower:
            subject = f"{urgency}Meeting Reschedule: Updated Time for Today's Review"
            body = (
                f"Hi {user_id.replace('_', ' ').title()},\n\n"
                f"The meeting originally scheduled has been moved. Please confirm your attendance "
                f"by clicking the link below {time_pressure}.\n\n"
                f"▶ Confirm Attendance: https://calendar.company-internal.com/confirm?id=MTG{random.randint(1000,9999)}\n\n"
            )
            if visits_settings:
                body += "You can also update your calendar sync preferences in your account settings.\n\n"
            body += f"Best regards,\n{sender_name}"

        elif "document" in scenario_lower or "file" in scenario_lower or "share" in scenario_lower:
            subject = f"{urgency}Shared Document: Confidential - Review Required"
            body = (
                f"Hi {user_id.replace('_', ' ').title()},\n\n"
                f"A confidential document has been shared with you that requires your review "
                f"{time_pressure}.\n\n"
                f"▶ Open Document: https://docs.company-internal.com/shared/{user_id}/review\n\n"
            )
            if is_copy_paster:
                body += "Important: This document contains sensitive information. Do not download or copy content externally.\n\n"
            if visits_admin:
                body += "As an admin user, your approval is required before this document can be distributed.\n\n"
            body += f"Thank you,\n{sender_name}"

        elif "update" in scenario_lower or "software" in scenario_lower:
            subject = f"{urgency}Critical Security Update Required for Your Workstation"
            body = (
                f"Dear {user_id.replace('_', ' ').title()},\n\n"
                f"A critical security patch is available for your workstation. This update addresses "
                f"vulnerabilities that could affect your account.\n\n"
                f"▶ Install Update: https://it-updates.company-internal.com/patch/{random.randint(100,999)}\n\n"
                f"Please complete this update {time_pressure}. "
            )
            if is_fast_typist:
                body += "This is a one-click installation that takes less than 30 seconds.\n\n"
            else:
                body += "The update process takes approximately 5 minutes.\n\n"
            body += f"Regards,\n{sender_name}"

        elif "benefit" in scenario_lower or "hr" in scenario_lower or "policy" in scenario_lower:
            subject = f"{urgency}Action Required: Updated Benefits Enrollment"
            body = (
                f"Dear {user_id.replace('_', ' ').title()},\n\n"
                f"We're updating our employee benefits program. Your enrollment preferences "
                f"need to be confirmed {time_pressure} to avoid any lapse in coverage.\n\n"
                f"▶ Review Benefits: https://hr-portal.company-internal.com/benefits/enroll\n\n"
            )
            body += f"Please review and submit your selections.\n\nBest regards,\n{sender_name}"

        else:
            # Custom scenario — generic adaptive template
            subject = f"{urgency}Action Required: {scenario.title()}"
            body = (
                f"Dear {user_id.replace('_', ' ').title()},\n\n"
                f"This is regarding: {scenario}.\n\n"
                f"We require your immediate attention on this matter. Please review the details "
                f"and take the necessary action {time_pressure}.\n\n"
                f"▶ Take Action: https://portal.company-internal.com/action/{user_id}\n\n"
            )
            if is_high_risk:
                body += "Note: Your account has been flagged for additional security review.\n\n"
            if visits_admin:
                body += "As an administrator, your response is critical for this process.\n\n"
            body += f"Regards,\n{sender_name}"

        # ── Risk factors that make this email effective ──
        risk_factors = []
        if is_high_risk:
            risk_factors.append("User has elevated risk score — more likely to fall for urgent requests")
        if is_heavy_clicker:
            risk_factors.append("User exhibits high click rate — added multiple call-to-action links")
        if is_fast_typist:
            risk_factors.append("User types quickly — email uses concise, time-pressured language")
        if is_copy_paster:
            risk_factors.append("User frequently copies/pastes — included credential-related instructions")
        if visits_admin:
            risk_factors.append("User accesses admin pages — email references administrative privileges")
        if visits_reports:
            risk_factors.append("User views reports — email references Q4/financial data")
        if not risk_factors:
            risk_factors.append("Standard adaptive template based on available behavioral data")

        return _cors_json({
            "email": {
                "subject": subject,
                "body": body,
                "from_name": sender_name,
                "from_email": sender_email,
                "scenario": scenario,
                "generated_at": datetime.utcnow().isoformat(),
            },
            "profile": profile,
            "risk_factors": risk_factors,
            "adaptation_summary": {
                "urgency_level": "high" if is_high_risk else "medium" if user_risk and user_risk >= 0.3 else "standard",
                "personalization_depth": "deep" if event_count > 20 else "moderate" if event_count > 5 else "basic",
                "attack_vector": scenario,
            },
        })

    except Exception as exc:
        logger.error("Email generation failed: %s", exc, exc_info=True)
        return _cors_json({"error": str(exc)}), 500


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    logger.info("Starting API server with collector enabled")
    logger.info("Collector DB: %s", COLLECTOR_DB_PATH)
    logger.info("API Key protection: %s", "enabled" if COLLECTOR_API_KEY else "disabled (dev mode)")
    app.run(host="0.0.0.0", port=8000, debug=False)
