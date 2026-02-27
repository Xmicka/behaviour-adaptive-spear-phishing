"""Centralized configuration for the research pipeline.

Keep simple constants here so the pipeline and models import shared
configuration rather than hardcoding values in multiple places.
"""
from pathlib import Path
import os
import base64
import json
import tempfile

# Auto-load .env file from backend directory
try:
    from dotenv import load_dotenv
    _env_path = Path(__file__).resolve().parent / ".env"
    if _env_path.exists():
        load_dotenv(_env_path)
except ImportError:
    pass  # python-dotenv not installed — rely on shell env vars

# Paths used by the pipeline (strings for easy use with pandas/pathlib)
INPUT_CSV_PATH = Path("backend") / "data" / "auth_sample.csv"
OUTPUT_CSV_PATH = Path("backend") / "data" / "final_risk_scores.csv"

# Isolation Forest hyperparameters
IF_CONTAMINATION = 0.05
IF_RANDOM_STATE = 42

# ── Collector configuration ──────────────────────────────────────
# SQLite database path for behavioral event storage
COLLECTOR_DB_PATH = Path("backend") / "data" / "behavioral_events.db"

# API key for authenticating collector webhook requests.
# In production, set via environment variable COLLECTOR_API_KEY.
# Empty string disables API key checking (development mode).
COLLECTOR_API_KEY = os.environ.get("COLLECTOR_API_KEY", "")

# Allowed origins for collector CORS (empty = allow all in dev)
COLLECTOR_ALLOWED_ORIGINS = os.environ.get("COLLECTOR_ALLOWED_ORIGINS", "*")

# ── CORS configuration ───────────────────────────────────────────
# Comma-separated allowed origins for production.
# Default "*" allows all origins (dev mode). In production, set to
# your frontend domain, e.g. "https://your-app.web.app,https://your-domain.com"
CORS_ALLOWED_ORIGINS = os.environ.get("CORS_ALLOWED_ORIGINS", "*")

# ── Email / SMTP configuration ───────────────────────────────────
# SMTP credentials — set via env vars for security.
# When not set, the platform operates in log-only mode (emails
# are recorded in SQLite but not actually delivered).
SMTP_EMAIL = os.environ.get("SMTP_EMAIL", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))

# Master toggle for email sending (set to "false" to disable)
EMAIL_ENABLED = os.environ.get("EMAIL_ENABLED", "true").lower() in ("true", "1", "yes")

# Base URL for tracking links and micro-training redirects
PLATFORM_BASE_URL = os.environ.get("PLATFORM_BASE_URL", "http://localhost:8000")

# ── Risk threshold for automated email dispatch ──────────────────
# Users with final_risk_score >= this threshold will automatically
# receive phishing simulation emails when the pipeline runs.
RISK_THRESHOLD_EMAIL = float(os.environ.get("RISK_THRESHOLD_EMAIL", "0.5"))

# ── Email event database ─────────────────────────────────────────
EMAIL_DB_PATH = Path("backend") / "data" / "email_events.db"

# ── Firebase / Google credentials ────────────────────────────────
# Supports two modes:
#   1. File path: GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
#   2. Base64-encoded JSON: FIREBASE_CREDENTIALS_BASE64=<base64 string>
#      (For platforms like Render where you can't upload files)
_firebase_cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
_firebase_cred_b64 = os.environ.get("FIREBASE_CREDENTIALS_BASE64", "")

if _firebase_cred_b64 and not _firebase_cred_path:
    # Decode base64 credentials to a temp file and set the env var
    try:
        _cred_data = base64.b64decode(_firebase_cred_b64)
        _tmp = tempfile.NamedTemporaryFile(
            mode="wb", suffix=".json", delete=False, prefix="firebase_cred_"
        )
        _tmp.write(_cred_data)
        _tmp.close()
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = _tmp.name
    except Exception:
        pass  # Silently skip if decode fails — Firestore sync will no-op

__all__ = [
    "INPUT_CSV_PATH",
    "OUTPUT_CSV_PATH",
    "IF_CONTAMINATION",
    "IF_RANDOM_STATE",
    "COLLECTOR_DB_PATH",
    "COLLECTOR_API_KEY",
    "COLLECTOR_ALLOWED_ORIGINS",
    "CORS_ALLOWED_ORIGINS",
    "SMTP_EMAIL",
    "SMTP_PASSWORD",
    "SMTP_HOST",
    "SMTP_PORT",
    "EMAIL_ENABLED",
    "PLATFORM_BASE_URL",
    "RISK_THRESHOLD_EMAIL",
    "EMAIL_DB_PATH",
]
