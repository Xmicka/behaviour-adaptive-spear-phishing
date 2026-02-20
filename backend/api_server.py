from flask import Flask, jsonify, make_response, request
import pandas as pd
from pathlib import Path
import sys
import random
from datetime import datetime, timedelta

# Add parent directory to path so backend can be imported
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.training.training_decision import decide_training_actions

app = Flask(__name__)

DATA_DIR = Path(__file__).resolve().parent / "data"
FINAL_CSV = DATA_DIR / "final_risk_scores.csv"


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
    "high_email_volume": 0.8,  # More emails = higher chance of missing malicious ones
    "frequent_downloads": 0.7,  # Habit of downloading files
    "password_reuse": 0.9,  # Severe vulnerability
    "late_night_access": 0.6,  # Tired = more mistakes
    "rapid_clicking": 0.75,  # Doesn't read carefully
    "admin_privileges": 0.95,  # High value target
    "c_suite": 0.9,  # Executive = high value target
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
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return resp


@app.after_request
def after_request(response):
    """Add CORS headers to all responses."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response


@app.route("/api/health", methods=["GET", "OPTIONS"])
def health():
    """Health check endpoint."""
    return _cors_json({"status": "ok", "service": "behaviour-adaptive-spear-phishing-backend"})


@app.route("/api/risk-summary")
def risk_summary():
    if not FINAL_CSV.exists():
        return _cors_json({"error": "data not available"}), 500

    df = pd.read_csv(FINAL_CSV)
    # Ensure expected columns
    if "final_risk_score" not in df.columns:
        return _cors_json({"error": "unexpected CSV format"}), 500

    df2 = df.copy()
    df2["tier"] = df2["final_risk_score"].apply(_tier_from_score)
    # tokenise risk reason into tags
    df2["reason_tags"] = df2.get("risk_reason", "").astype(str).apply(lambda s: [t.strip() for t in s.split(";") if t.strip()])

    # use training decision util to infer action taken
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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)


# ============ NEW ENDPOINTS ============

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
        
        # Select phishing type based on risk score
        if risk_score > 0.7:
            phishing_type = "credential_harvest"
        elif risk_score > 0.4:
            phishing_type = "malware_delivery"
        else:
            phishing_type = "social_engineering"
        
        # Get template
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
