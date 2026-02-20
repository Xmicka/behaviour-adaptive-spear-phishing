from flask import Flask, jsonify, make_response, request
import pandas as pd
from pathlib import Path
import sys

# Add parent directory to path so backend can be imported
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.training.training_decision import decide_training_actions

app = Flask(__name__)

DATA_DIR = Path(__file__).resolve().parent / "data"
FINAL_CSV = DATA_DIR / "final_risk_scores.csv"


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
