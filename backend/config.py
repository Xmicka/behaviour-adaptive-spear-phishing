"""Centralized configuration for the research pipeline.

Keep simple constants here so the pipeline and models import shared
configuration rather than hardcoding values in multiple places.
"""
from pathlib import Path
import os

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

__all__ = [
    "INPUT_CSV_PATH",
    "OUTPUT_CSV_PATH",
    "IF_CONTAMINATION",
    "IF_RANDOM_STATE",
    "COLLECTOR_DB_PATH",
    "COLLECTOR_API_KEY",
    "COLLECTOR_ALLOWED_ORIGINS",
]
