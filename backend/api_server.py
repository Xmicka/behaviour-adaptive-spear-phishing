from flask import Flask, jsonify, make_response, request, send_from_directory, redirect
import pandas as pd
from pathlib import Path
import sys
import random
import logging
import json as _json
from datetime import datetime, timedelta

# Add parent directory to path so backend can be imported
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.training.training_decision import decide_training_actions
from backend.training.user_state import UserStateManager
from backend.config import (
    COLLECTOR_DB_PATH, COLLECTOR_API_KEY, EMAIL_DB_PATH,
    RISK_THRESHOLD_EMAIL, PLATFORM_BASE_URL, SMTP_EMAIL,
    CORS_ALLOWED_ORIGINS,
)
from backend.collector.event_store import EventStore
from backend.collector.firestore_sync import sync_events_to_firestore, sync_risk_scores_to_firestore
from backend.mailer.email_sender import send_phishing_email, generate_tracking_links, create_tracking_token
from backend.mailer.email_templates import generate_email_content, get_available_scenarios
from backend.training.training_pages import generate_training_page, generate_mandatory_training_page, generate_compliance_page
from backend.mailer.email_logger import EmailLogger
from backend.scheduler import start_scheduler, stop_scheduler, get_scheduler_status

logger = logging.getLogger(__name__)

app = Flask(__name__)

DATA_DIR = Path(__file__).resolve().parent / "data"
FINAL_CSV = DATA_DIR / "final_risk_scores.csv"
STATIC_DIR = Path(__file__).resolve().parent / "static"

# Initialize stores
_event_store = EventStore(db_path=str(COLLECTOR_DB_PATH))
_email_logger = EmailLogger(db_path=str(EMAIL_DB_PATH))
_state_mgr = UserStateManager(db_path=str(COLLECTOR_DB_PATH))


# Phishing email templates based on behavior patterns (legacy — kept for /api/phishing-simulation)
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
    origin = request.headers.get("Origin", "*")
    resp.headers["Access-Control-Allow-Origin"] = origin
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
    """Add CORS headers to all responses.
    Supports chrome-extension:// origins, localhost, and configured production origins."""
    origin = request.headers.get("Origin", "")

    # Parse allowed origins from config (comma-separated or "*")
    _allowed = [o.strip() for o in CORS_ALLOWED_ORIGINS.split(",") if o.strip()] if CORS_ALLOWED_ORIGINS != "*" else []

    # Always allow: chrome-extension://, localhost, 127.0.0.1, same-origin, or wildcard
    if (
        not origin
        or CORS_ALLOWED_ORIGINS == "*"
        or origin.startswith("chrome-extension://")
        or origin.startswith("http://localhost")
        or origin.startswith("https://localhost")
        or origin.startswith("http://127.0.0.1")
        or origin in _allowed
    ):
        response.headers["Access-Control-Allow-Origin"] = origin or "*"
    else:
        # Reject unknown origins in production
        response.headers["Access-Control-Allow-Origin"] = _allowed[0] if _allowed else "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-API-Key"
    return response


# ============ EXISTING ENDPOINTS ============

@app.route("/api/health", methods=["GET", "OPTIONS"])
def health():
    """Health check endpoint."""
    collector_stats = _event_store.get_event_stats()
    email_stats = _email_logger.get_email_stats()
    return _cors_json({
        "status": "ok",
        "service": "behaviour-adaptive-spear-phishing-backend",
        "collector": {
            "active": True,
            "total_events": collector_stats["total_events"],
            "unique_users": collector_stats["unique_users"],
        },
        "email": email_stats,
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
        # Merge with real training session data
        sessions = _email_logger.get_training_sessions(user_id=r["user"])
        has_pending = _email_logger.has_pending_training(r["user"])
        completed_count = len([s for s in sessions if s["status"] == "completed"])

        payload.append(
            {
                "user": r["user"],
                "training_action": r["training_action"],
                "micro_training_url": r.get("micro_training_url", ""),
                "mandatory_training_url": r.get("mandatory_training_url", ""),
                "has_pending_training": has_pending,
                "completed_sessions": completed_count,
                "total_sessions": len(sessions),
                "sessions": sessions[:5],
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

    # If user clicked, trigger micro-training
    if clicked and user:
        _trigger_training_for_user(user, training_type="micro", trigger_email_id="manual_sim")

    return _cors_json({
        "user": user,
        "clicked": clicked,
        "timestamp": timestamp,
        "training_triggered": clicked,
        "feedback": "Great job! You didn't fall for the phishing email." if not clicked else "Be more careful with emails from unknown senders. Micro-training has been assigned."
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
    """Webhook endpoint to receive behavioral events from the browser collector."""
    if request.method == "OPTIONS":
        return _cors_json({"ok": True})

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

        # Optional Firestore sync
        try:
            sync_events_to_firestore(user_id, session_id, events)
        except Exception as sync_exc:
            logger.debug("Firestore sync skipped: %s", sync_exc)

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
    """Query collected behavioral events with optional filters."""
    if request.method == "OPTIONS":
        return _cors_json({"ok": True})

    user_id = request.args.get("user_id")
    event_type = request.args.get("event_type")
    since = request.args.get("since")
    limit = min(int(request.args.get("limit", 200)), 1000)

    try:
        events = _event_store.get_events(
            user_id=user_id, event_type=event_type,
            since=since, limit=limit,
        )
        return _cors_json({
            "data": events, "count": len(events),
            "filters": {"user_id": user_id, "event_type": event_type, "since": since, "limit": limit},
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

    After scoring, automatically sends phishing emails to users above the
    risk threshold (RISK_THRESHOLD_EMAIL).
    """
    if request.method == "OPTIONS":
        return _cors_json({"ok": True})

    try:
        auth_df = _event_store.export_to_auth_format()
        if auth_df.empty:
            return _cors_json({
                "status": "no_data",
                "message": "No behavioral events collected yet.",
            }), 400

        user_count = auth_df["user"].nunique()
        event_count = len(auth_df)
        run_id = _event_store.record_pipeline_start(event_count, user_count)

        from backend.features.feature_extractor import extract_user_features
        from backend.models.isolation_forest import run_isolation_forest
        from backend.scoring.risk_score import compute_risk_score

        features = extract_user_features(auth_df)
        if features.empty:
            _event_store.record_pipeline_finish(run_id, "failed", "No features extracted")
            return _cors_json({"status": "error", "message": "No features could be extracted"}), 500

        anomalies = run_isolation_forest(features)
        results = compute_risk_score(anomalies)

        if results.index.name is None:
            if "user" in results.columns:
                out_df = results.reset_index(drop=True)
            else:
                out_df = results.reset_index()
        else:
            out_df = results.reset_index()

        out_df.to_csv(FINAL_CSV, index=False)
        _event_store.record_pipeline_finish(run_id, "completed")

        # ── Sync risk scores to Firestore ──
        try:
            if "final_risk_score" in out_df.columns:
                scores = out_df[["user", "final_risk_score"]].to_dict("records")
                sync_risk_scores_to_firestore(scores)
        except Exception as sync_exc:
            logger.debug("Firestore risk score sync skipped: %s", sync_exc)

        # ── AUTO-SEND phishing emails to high-risk users ──
        emails_sent = []
        if "final_risk_score" in out_df.columns:
            high_risk = out_df[out_df["final_risk_score"] >= RISK_THRESHOLD_EMAIL]
            for _, row in high_risk.iterrows():
                user_id = row.get("user", "unknown")
                risk_score = float(row["final_risk_score"])

                # Skip if user has pending training
                if _email_logger.has_pending_training(user_id):
                    logger.info("Skipping email for %s — pending training", user_id)
                    continue

                result = _send_email_to_user(user_id, risk_score)
                if result:
                    emails_sent.append(result)

        return _cors_json({
            "status": "completed",
            "run_id": run_id,
            "events_processed": event_count,
            "users_analyzed": user_count,
            "high_risk_users": len(out_df[out_df["final_risk_score"] >= 0.6]) if "final_risk_score" in out_df.columns else 0,
            "emails_auto_sent": len(emails_sent),
            "email_details": emails_sent,
            "risk_threshold": RISK_THRESHOLD_EMAIL,
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


# ============ EMAIL FLOW ENDPOINTS ============

def _get_user_behavioral_profile(user_id: str) -> dict:
    """Build a rich behavioral profile for a user from collected events.

    Used by the dynamic email engine to construct context-aware phishing emails.
    """
    events = _event_store.get_events(user_id=user_id, limit=1000)
    page_views = [e for e in events if e.get("event_type") == "page_view"]
    clicks = [e for e in events if e.get("event_type") == "click"]
    typing_events = [e for e in events if e.get("event_type") == "typing_cadence"]
    copy_events = [e for e in events if e.get("event_type") in ("copy_event", "paste_event")]
    login_events = [e for e in events if e.get("event_type") == "login_attempt"]
    session_starts = [e for e in events if e.get("event_type") == "session_start"]
    navigation_events = [e for e in events if e.get("event_type") == "navigation"]

    # Pages visited (deduplicated, ordered by first visit)
    visited_pages = []
    for pv in page_views:
        url = pv.get("page_url", "")
        if url and url not in visited_pages:
            visited_pages.append(url)

    # Extract unique domains the user interacts with
    domains = []
    for e in events:
        url = e.get("page_url", "")
        if url:
            # Try to extract domain from URL
            parts = url.split("/")
            if len(parts) >= 3 and "." in parts[2]:
                domain = parts[2].replace("www.", "")
                if domain and domain not in domains:
                    domains.append(domain)

    # Also extract domains from event_data (e.g., login_attempt has 'domain' field)
    for le in login_events:
        try:
            data = _json.loads(le.get("event_data", "{}")) if isinstance(le.get("event_data"), str) else le.get("event_data", {})
            d = data.get("domain", "")
            if d and d not in domains:
                domains.append(d)
        except Exception:
            pass

    # Typing speed analysis
    avg_typing_speed = None
    if typing_events:
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

    # Activity time patterns (hour distribution)
    active_hours = []
    for e in events:
        ts = e.get("timestamp", "")
        if ts:
            try:
                hour = int(ts[11:13]) if len(ts) > 13 else -1
                if 0 <= hour <= 23:
                    active_hours.append(hour)
            except (ValueError, IndexError):
                pass

    is_late_night_user = False
    if active_hours:
        late_count = sum(1 for h in active_hours if h >= 22 or h <= 5)
        is_late_night_user = late_count / len(active_hours) > 0.3

    # Login attempt domains (shows what services they authenticate to)
    login_domains = []
    for le in login_events:
        try:
            data = _json.loads(le.get("event_data", "{}")) if isinstance(le.get("event_data"), str) else le.get("event_data", {})
            action = data.get("formAction", "")
            if action and action not in login_domains:
                login_domains.append(action)
        except Exception:
            pass

    return {
        "total_events": len(events),
        "total_clicks": len(clicks),
        "total_page_views": len(page_views),
        "copy_paste_events": len(copy_events),
        "pages_visited": visited_pages[:20],
        "domains": domains[:15],
        "avg_typing_speed_ms": round(avg_typing_speed) if avg_typing_speed else None,
        "sessions": len(session_starts),
        "login_domains": login_domains[:10],
        "is_late_night_user": is_late_night_user,
        "navigation_count": len(navigation_events),
    }


def _send_email_to_user(
    user_id: str,
    risk_score: float,
    recipient_email: str = "",
    scenario: str = "",
    context: str = "",
) -> dict:
    """Core helper: generate, send & log a phishing email for a user."""
    tracking_token = create_tracking_token()
    links = generate_tracking_links(tracking_token)

    # Get behavioral profile
    profile = _get_user_behavioral_profile(user_id)

    # Generate email content
    content = generate_email_content(
        user_id=user_id,
        risk_score=risk_score,
        phishing_link=links["phishing_link"],
        tracking_pixel_url=links["tracking_pixel"],
        scenario=scenario or None,
        context=context,
        behavioral_signals=profile,
    )

    # Use user_id as fallback email if none provided
    actual_recipient = recipient_email or f"{user_id}@company-internal.com"

    # Send email
    send_result = send_phishing_email(
        recipient_email=actual_recipient,
        subject=content["subject"],
        body_html=content["body_html"],
        body_text=content["body_text"],
        tracking_token=tracking_token,
        sender_name=content["sender_name"],
    )

    # Log to database
    _email_logger.log_email_sent(
        email_id=send_result["email_id"],
        tracking_token=tracking_token,
        user_id=user_id,
        recipient_email=actual_recipient,
        subject=content["subject"],
        scenario=content["scenario"],
        template_id=content["template_id"],
        risk_score=risk_score,
        sent_via=send_result["mode"],
    )

    # State machine: transition to PHISH_SENT
    _state_mgr.transition(user_id, "email_sent",
                          f"Phishing email sent (scenario={content['scenario']}, risk={risk_score:.2f})")

    return {
        "email_id": send_result["email_id"],
        "user_id": user_id,
        "recipient": actual_recipient,
        "subject": content["subject"],
        "scenario": content["scenario"],
        "template_id": content["template_id"],
        "risk_score": risk_score,
        "tracking_token": tracking_token,
        "sent": send_result["sent"],
        "mode": send_result["mode"],
        "error": send_result["error"],
        "phishing_link": links["phishing_link"],
    }


def _trigger_training_for_user(
    user_id: str,
    training_type: str = "micro",
    trigger_email_id: str = "",
) -> str:
    """Create a training session for a user."""
    session_id = _email_logger.create_training_session(
        user_id=user_id,
        training_type=training_type,
        trigger_email_id=trigger_email_id,
    )
    logger.info("Training session %s created for user %s (type=%s)", session_id, user_id, training_type)
    return session_id


@app.route("/api/email/send", methods=["POST", "OPTIONS"])
def send_email():
    """Send a phishing simulation email to a specific user.

    Request body:
    {
        "user_id": "employee_charlie",
        "recipient_email": "charlie@example.com",  // optional
        "scenario": "credential_harvest",           // optional
        "context": "IT department"                   // optional
    }
    """
    if request.method == "OPTIONS":
        return _cors_json({"ok": True})

    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id", "").strip()
    if not user_id:
        return _cors_json({"error": "user_id is required"}), 400

    # Check for pending training
    if _email_logger.has_pending_training(user_id):
        return _cors_json({
            "error": "User has pending training. Complete training before sending new phishing emails.",
            "has_pending_training": True,
        }), 409

    # Get risk score
    risk_score = 0.5
    if FINAL_CSV.exists():
        df = pd.read_csv(FINAL_CSV)
        user_row = df[df["user"] == user_id]
        if not user_row.empty:
            risk_score = float(user_row.iloc[0].get("final_risk_score", 0.5))

    result = _send_email_to_user(
        user_id=user_id,
        risk_score=risk_score,
        recipient_email=data.get("recipient_email", ""),
        scenario=data.get("scenario", ""),
        context=data.get("context", ""),
    )

    return _cors_json(result)


@app.route("/api/email/send-auto", methods=["POST", "OPTIONS"])
def send_email_auto():
    """Automatically send phishing emails to all users above risk threshold.

    Request body (optional):
    {
        "threshold": 0.5  // override default threshold
    }
    """
    if request.method == "OPTIONS":
        return _cors_json({"ok": True})

    data = request.get_json(silent=True) or {}
    threshold = float(data.get("threshold", RISK_THRESHOLD_EMAIL))

    if not FINAL_CSV.exists():
        return _cors_json({"error": "No risk scores available. Run pipeline first."}), 400

    df = pd.read_csv(FINAL_CSV)
    if "final_risk_score" not in df.columns:
        return _cors_json({"error": "Invalid risk score data"}), 500

    high_risk = df[df["final_risk_score"] >= threshold]
    results = []
    skipped = []

    for _, row in high_risk.iterrows():
        user_id = row.get("user", "unknown")
        risk_score = float(row["final_risk_score"])

        if _email_logger.has_pending_training(user_id):
            skipped.append({"user_id": user_id, "reason": "pending_training"})
            continue

        result = _send_email_to_user(user_id=user_id, risk_score=risk_score)
        results.append(result)

    return _cors_json({
        "threshold": threshold,
        "total_eligible": len(high_risk),
        "emails_sent": len(results),
        "skipped": skipped,
        "results": results,
    })


@app.route("/api/email/log", methods=["GET", "OPTIONS"])
def email_log():
    """Get email event log with optional user filter."""
    if request.method == "OPTIONS":
        return _cors_json({"ok": True})

    user_id = request.args.get("user_id")
    limit = min(int(request.args.get("limit", 100)), 500)

    emails = _email_logger.get_email_log(user_id=user_id, limit=limit)

    # Enrich with interaction data
    for email in emails:
        interactions = _email_logger.get_interactions(email_id=email["email_id"])
        email["interactions"] = interactions
        email["was_opened"] = any(i["interaction"] == "open" for i in interactions)
        email["was_clicked"] = any(i["interaction"] == "click" for i in interactions)
        email["was_reported"] = any(i["interaction"] == "report" for i in interactions)

    stats = _email_logger.get_email_stats()

    return _cors_json({
        "emails": emails,
        "count": len(emails),
        "stats": stats,
    })


@app.route("/api/email/track/<tracking_token>", methods=["GET"])
def track_email_click(tracking_token):
    """Track a phishing link click, trigger training, redirect to training page."""
    ip = request.remote_addr or ""
    ua = request.headers.get("User-Agent", "")[:200]

    email_info = _email_logger.log_interaction(
        tracking_token=tracking_token,
        interaction="click",
        ip_address=ip,
        user_agent=ua,
    )

    if email_info:
        user_id = email_info["user_id"]
        email_id = email_info["email_id"]

        # State machine: PHISH_SENT → PHISH_CLICKED → MICRO_TRAINING_REQUIRED (auto-chains)
        _state_mgr.transition(user_id, "phish_clicked",
                              f"User clicked phishing link (email={email_id})")

        # Trigger micro-training automatically
        _trigger_training_for_user(
            user_id=user_id,
            training_type="micro",
            trigger_email_id=email_id,
        )

        logger.info("Phishing click tracked for user %s (email %s) — training triggered", user_id, email_id)

        # Redirect to training landing page
        return redirect(f"{PLATFORM_BASE_URL}/api/training/landing/{tracking_token}")
    else:
        return redirect(f"{PLATFORM_BASE_URL}/api/training/landing/unknown")


@app.route("/api/email/pixel/<tracking_token>", methods=["GET"])
def track_email_open(tracking_token):
    """Track email open via 1×1 tracking pixel."""
    _email_logger.log_interaction(
        tracking_token=tracking_token,
        interaction="open",
        ip_address=request.remote_addr or "",
        user_agent=request.headers.get("User-Agent", "")[:200],
    )

    # Return 1×1 transparent GIF
    gif = b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\xff\xff\xff\x21\xf9\x04\x01\x0a\x00\x01\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x4c\x01\x00\x3b'
    resp = make_response(gif)
    resp.headers["Content-Type"] = "image/gif"
    resp.headers["Cache-Control"] = "no-store, no-cache"
    return resp


@app.route("/api/email/report", methods=["POST", "OPTIONS"])
def report_email():
    """Allow a user to report a phishing email."""
    if request.method == "OPTIONS":
        return _cors_json({"ok": True})

    data = request.get_json(silent=True) or {}
    tracking_token = data.get("tracking_token", "").strip()

    if not tracking_token:
        return _cors_json({"error": "tracking_token is required"}), 400

    email_info = _email_logger.log_interaction(
        tracking_token=tracking_token,
        interaction="report",
    )

    if email_info:
        # State machine: user correctly reported phishing
        _state_mgr.transition(email_info["user_id"], "phish_reported",
                              "User correctly reported phishing simulation")
        return _cors_json({
            "status": "reported",
            "message": "Great job! You correctly identified this as a phishing simulation.",
            "user_id": email_info["user_id"],
        })
    return _cors_json({"error": "Unknown tracking token"}), 404


@app.route("/api/email/scenarios", methods=["GET", "OPTIONS"])
def list_email_scenarios():
    """List available email attack scenarios."""
    if request.method == "OPTIONS":
        return _cors_json({"ok": True})
    return _cors_json({"scenarios": get_available_scenarios()})


# ============ TRAINING ENDPOINTS ============

@app.route("/api/training/landing/<tracking_token>", methods=["GET"])
def training_landing(tracking_token):
    """Interactive multi-step training page shown after a user clicks a phishing link."""
    email_info = _email_logger.get_email_by_token(tracking_token)

    user_id = email_info["user_id"] if email_info else "unknown"
    scenario = email_info["scenario"] if email_info else "unknown"
    subject = email_info["subject"] if email_info else "(unknown)"
    risk_score = float(email_info.get("risk_score", 0.5)) if email_info else 0.5

    complete_url = f"{PLATFORM_BASE_URL}/api/training/complete-landing/{tracking_token}"

    html = generate_training_page(
        tracking_token=tracking_token,
        user_id=user_id,
        scenario=scenario,
        subject=subject,
        risk_score=risk_score,
        complete_url=complete_url,
    )
    resp = make_response(html)
    resp.headers["Content-Type"] = "text/html"
    return resp


@app.route("/api/training/complete-landing/<tracking_token>", methods=["GET"])
def complete_training_landing(tracking_token):
    """Complete micro-training, then show mandatory training with quiz."""
    email_info = _email_logger.get_email_by_token(tracking_token)
    user_id = "unknown"
    if email_info:
        user_id = email_info["user_id"]
        count = _email_logger.complete_training_for_user(user_id)
        logger.info("Micro-training completed for user %s (%d session(s))", user_id, count)

        # State machine: MICRO_TRAINING_REQUIRED → MICRO_TRAINING_COMPLETED → MANDATORY_TRAINING_REQUIRED
        _state_mgr.transition(user_id, "micro_completed",
                              "Micro-training completed via landing page")

    complete_url = f"{PLATFORM_BASE_URL}/api/training/mandatory-complete/{user_id}"
    html = generate_mandatory_training_page(user_id=user_id, complete_url=complete_url)
    resp = make_response(html)
    resp.headers["Content-Type"] = "text/html"
    return resp


@app.route("/api/training/trigger", methods=["POST", "OPTIONS"])
def trigger_training():
    """Manually trigger training for a user.

    Request body:
    {
        "user_id": "employee_charlie",
        "training_type": "micro",      // "micro" or "mandatory"
        "trigger_email_id": ""         // optional
    }
    """
    if request.method == "OPTIONS":
        return _cors_json({"ok": True})

    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id", "").strip()
    if not user_id:
        return _cors_json({"error": "user_id is required"}), 400

    training_type = data.get("training_type", "micro")
    trigger_email_id = data.get("trigger_email_id", "")

    session_id = _trigger_training_for_user(user_id, training_type, trigger_email_id)

    return _cors_json({
        "status": "training_assigned",
        "session_id": session_id,
        "user_id": user_id,
        "training_type": training_type,
    })


@app.route("/api/training/complete", methods=["POST", "OPTIONS"])
def complete_training():
    """Mark training complete for a user.

    Request body:
    {
        "user_id": "employee_charlie",
        "session_id": "train_abc123",  // optional — completes specific session
        "score": 100                    // optional
    }
    """
    if request.method == "OPTIONS":
        return _cors_json({"ok": True})

    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id", "").strip()
    session_id = data.get("session_id", "").strip()
    score = float(data.get("score", 100))

    if not user_id and not session_id:
        return _cors_json({"error": "user_id or session_id is required"}), 400

    if session_id:
        ok = _email_logger.complete_training(session_id, score)
        return _cors_json({"status": "completed" if ok else "not_found", "session_id": session_id})
    else:
        count = _email_logger.complete_training_for_user(user_id, score)
        return _cors_json({
            "status": "completed",
            "user_id": user_id,
            "sessions_completed": count,
        })


@app.route("/api/training/status", methods=["GET", "OPTIONS"])
@app.route("/api/training/status/<user_id>", methods=["GET", "OPTIONS"])
def training_status_api(user_id=None):
    """Get training status, optionally for a specific user."""
    if request.method == "OPTIONS":
        return _cors_json({"ok": True})

    uid = user_id or request.args.get("user_id")

    sessions = _email_logger.get_training_sessions(user_id=uid, limit=100)
    stats = _email_logger.get_training_stats()

    # Per-user summary
    user_summary = {}
    for s in sessions:
        u = s["user_id"]
        if u not in user_summary:
            user_summary[u] = {"user_id": u, "total": 0, "completed": 0, "pending": 0, "has_pending": False}
        user_summary[u]["total"] += 1
        if s["status"] == "completed":
            user_summary[u]["completed"] += 1
        else:
            user_summary[u]["pending"] += 1
            user_summary[u]["has_pending"] = True

    return _cors_json({
        "sessions": sessions,
        "stats": stats,
        "user_summary": list(user_summary.values()),
    })

# ============ MANDATORY TRAINING COMPLETION ============

@app.route("/api/training/mandatory-complete/<user_id>", methods=["GET"])
def mandatory_complete(user_id):
    """Mark mandatory training as complete, transition to COMPLIANT.

    Also reduces the user's risk score in the pipeline CSV as a reward
    for completing training (20% reduction, clamped to 0).
    """
    _state_mgr.transition(user_id, "mandatory_completed",
                          "Mandatory training completed by user")

    # ── Risk score reduction reward ──
    try:
        if FINAL_CSV.exists():
            import pandas as _pd
            df = _pd.read_csv(FINAL_CSV)
            mask = df["user"] == user_id
            if mask.any():
                old_score = float(df.loc[mask, "final_risk_score"].iloc[0])
                new_score = max(0.0, old_score * 0.8)  # 20% reduction
                df.loc[mask, "final_risk_score"] = new_score
                df.to_csv(FINAL_CSV, index=False)
                logger.info(
                    "Risk score reduced for %s after training: %.4f → %.4f",
                    user_id, old_score, new_score,
                )
    except Exception as e:
        logger.warning("Could not reduce risk score for %s: %s", user_id, e)

    html = generate_compliance_page(user_id=user_id)
    resp = make_response(html)
    resp.headers["Content-Type"] = "text/html"
    return resp


# ============ USER STATE ENDPOINTS ============

@app.route("/api/user-states", methods=["GET", "OPTIONS"])
def get_user_states():
    """Get all user states for the dashboard."""
    if request.method == "OPTIONS":
        return _cors_json({"ok": True})

    states = _state_mgr.get_all_states()
    distribution = _state_mgr.get_state_distribution()

    return _cors_json({
        "states": states,
        "distribution": distribution,
        "total_users": len(states),
    })


@app.route("/api/user-states/<user_id>", methods=["GET", "OPTIONS"])
def get_user_state(user_id):
    """Get state and transition history for a specific user."""
    if request.method == "OPTIONS":
        return _cors_json({"ok": True})

    return _cors_json({
        "user_id": user_id,
        "current_state": _state_mgr.get_state(user_id),
        "history": _state_mgr.get_history(user_id),
    })


# ============ PIPELINE SCHEDULER ENDPOINTS ============

@app.route("/api/pipeline/auto-start", methods=["POST", "OPTIONS"])
def pipeline_auto_start():
    """Start the autonomous pipeline scheduler."""
    if request.method == "OPTIONS":
        return _cors_json({"ok": True})

    data = request.get_json(silent=True) or {}
    interval = int(data.get("interval_minutes", 5))

    started = start_scheduler(interval, app.app_context)
    if started:
        return _cors_json({"status": "started", "interval_minutes": interval})
    return _cors_json({"status": "already_running", **get_scheduler_status()})


@app.route("/api/pipeline/auto-stop", methods=["POST", "OPTIONS"])
def pipeline_auto_stop():
    """Stop the autonomous pipeline scheduler."""
    if request.method == "OPTIONS":
        return _cors_json({"ok": True})

    stopped = stop_scheduler()
    if stopped:
        return _cors_json({"status": "stopped"})
    return _cors_json({"status": "not_running"})


@app.route("/api/pipeline/scheduler-status", methods=["GET", "OPTIONS"])
def pipeline_scheduler_status():
    """Get the scheduler status."""
    if request.method == "OPTIONS":
        return _cors_json({"ok": True})
    return _cors_json(get_scheduler_status())


# ============ UNIFIED DASHBOARD ENDPOINT ============

@app.route("/api/dashboard", methods=["GET", "OPTIONS"])
def dashboard_data():
    """Unified endpoint returning all real data for the dashboard.

    Aggregates risk scores, event stats, email logs, and training data.
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
                # Merge with real training session data
                has_pending = _email_logger.has_pending_training(row["user"])
                sessions = _email_logger.get_training_sessions(user_id=row["user"])
                completed_count = len([s for s in sessions if s["status"] == "completed"])
                is_pending = action in ("MICRO", "MANDATORY") or has_pending
                if is_pending:
                    training_pending += 1
                training_data.append({
                    "user_id": row["user"],
                    "training_action": action,
                    "micro_training_url": row.get("micro_training_url", ""),
                    "mandatory_training_url": row.get("mandatory_training_url", ""),
                    "is_pending": is_pending,
                    "has_pending_training": has_pending,
                    "completed_sessions": completed_count,
                    "total_sessions": len(sessions),
                    "sessions": sessions[:3],
                })

        # ── Event collection stats ──
        event_stats_data = _event_store.get_event_stats()
        pipeline_runs = _event_store.get_pipeline_runs(limit=5)

        # ── Per-user event counts ──
        user_event_counts = {}
        for u in users:
            events = _event_store.get_events(user_id=u["user_id"], limit=1000)
            user_event_counts[u["user_id"]] = len(events)

        # ── Email stats ──
        email_stats_data = _email_logger.get_email_stats()
        email_log = _email_logger.get_email_log(limit=50)
        for email in email_log:
            interactions = _email_logger.get_interactions(email_id=email["email_id"])
            email["interactions"] = interactions
            email["was_clicked"] = any(i["interaction"] == "click" for i in interactions)
            email["was_opened"] = any(i["interaction"] == "open" for i in interactions)
            email["was_reported"] = any(i["interaction"] == "report" for i in interactions)

        # ── Training stats ──
        training_stats = _email_logger.get_training_stats()

        # ── Per-user email counts ──
        user_email_counts = {}
        for u in users:
            user_emails = _email_logger.get_email_log(user_id=u["user_id"], limit=100)
            user_email_counts[u["user_id"]] = {
                "total_sent": len(user_emails),
                "clicked": len([e for e in user_emails if e.get("status") == "clicked"]),
                "last_sent": user_emails[0]["sent_at"] if user_emails else None,
            }

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
                    "description": f"{u['user_id']} has {u['failed_login_ratio']:.0%} failed login ratio.",
                    "action": "Monitor Activity",
                })

        # Email-related alerts
        if email_stats_data["total_clicked"] > 0:
            alerts.append({
                "severity": "high",
                "title": f"{email_stats_data['total_clicked']} User(s) Clicked Phishing Links",
                "description": f"Click rate: {email_stats_data['click_rate']:.0%}. "
                               "Micro-training has been auto-assigned.",
                "action": "View Training Status",
            })

        if event_stats_data["total_events"] == 0:
            alerts.append({
                "severity": "medium",
                "title": "No Behavioral Data Collected",
                "description": "Deploy the collector script to start gathering data.",
                "action": "View Setup Guide",
            })

        # ── Recommendations ──
        recommendations = []
        if risk_distribution["high"] > 0:
            recommendations.append({
                "priority": "urgent",
                "title": f"Address {risk_distribution['high']} High-Risk User(s)",
                "description": f"Send phishing simulations and assign mandatory training.",
                "impact": f"Prevent {risk_distribution['high']} potential breaches",
            })
        if training_pending > 0:
            recommendations.append({
                "priority": "high",
                "title": f"Complete {training_pending} Pending Training(s)",
                "description": "Follow up to ensure training completion.",
                "impact": "Improve security posture",
            })
        if total_users > 0 and email_stats_data["total_sent"] == 0:
            recommendations.append({
                "priority": "high",
                "title": "Run First Phishing Simulation",
                "description": "No simulation emails have been sent yet. Use auto-send to test high-risk users.",
                "impact": "Establish baseline click rate",
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
                "total_events_collected": event_stats_data["total_events"],
                "last_pipeline_run": pipeline_runs[0]["started_at"] if pipeline_runs else None,
                "total_emails_sent": email_stats_data["total_sent"],
                "email_click_rate": email_stats_data["click_rate"],
            },
            "risk_distribution": risk_distribution,
            "users": users,
            "user_event_counts": user_event_counts,
            "user_email_counts": user_email_counts,
            "training": training_data,
            "training_stats": training_stats,
            "email_log": email_log,
            "email_stats": email_stats_data,
            "alerts": alerts,
            "recommendations": recommendations,
            "event_stats": event_stats_data,
            "pipeline_runs": pipeline_runs,
            "user_states": _state_mgr.get_all_states(),
            "state_distribution": _state_mgr.get_state_distribution(),
            "scheduler_status": get_scheduler_status(),
        })

    except Exception as exc:
        logger.error("Dashboard data failed: %s", exc, exc_info=True)
        return _cors_json({"error": str(exc)}), 500


# ============ ADAPTIVE EMAIL GENERATOR (legacy endpoint) ============

@app.route("/api/generate-email", methods=["POST", "OPTIONS"])
def generate_email():
    """Generate an adaptive spear phishing email tailored to a user's profile."""
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
        profile = _get_user_behavioral_profile(user_id)

        # Risk score from pipeline
        user_risk = None
        user_risk_reason = ""
        if FINAL_CSV.exists():
            df = pd.read_csv(FINAL_CSV)
            user_row = df[df["user"] == user_id]
            if not user_row.empty:
                user_risk = float(user_row.iloc[0].get("final_risk_score", 0))
                user_risk_reason = str(user_row.iloc[0].get("risk_reason", ""))

        risk_score = user_risk if user_risk is not None else 0.5

        # Generate using new template engine
        tracking_token = create_tracking_token()
        links = generate_tracking_links(tracking_token)

        content = generate_email_content(
            user_id=user_id,
            risk_score=risk_score,
            phishing_link=links["phishing_link"],
            tracking_pixel_url=links["tracking_pixel"],
            scenario=scenario if scenario != "credential verification" else None,
            context=context,
            behavioral_signals=profile,
        )

        profile["risk_score"] = user_risk
        profile["risk_reason"] = user_risk_reason

        return _cors_json({
            "email": {
                "subject": content["subject"],
                "body": content["body_text"],
                "body_html": content["body_html"],
                "from_name": content["sender_name"],
                "from_email": content["sender_email"],
                "scenario": content["scenario"],
                "template_id": content["template_id"],
                "tracking_token": tracking_token,
                "phishing_link": links["phishing_link"],
                "generated_at": datetime.utcnow().isoformat(),
            },
            "profile": profile,
            "can_send": True,
            "send_endpoint": "/api/email/send",
        })

    except Exception as exc:
        logger.error("Email generation failed: %s", exc, exc_info=True)
        return _cors_json({"error": str(exc)}), 500


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    logger.info("Starting API server with collector enabled")
    logger.info("Collector DB: %s", COLLECTOR_DB_PATH)
    logger.info("Email DB: %s", EMAIL_DB_PATH)
    logger.info("Risk threshold for auto-email: %s", RISK_THRESHOLD_EMAIL)
    logger.info("SMTP configured: %s", "yes" if SMTP_EMAIL else "no (log-only mode)")
    logger.info("API Key protection: %s", "enabled" if COLLECTOR_API_KEY else "disabled (dev mode)")
    app.run(host="0.0.0.0", port=8000, debug=False)
