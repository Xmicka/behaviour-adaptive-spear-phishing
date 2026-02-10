"""Centralized configuration for the research pipeline.

Keep simple constants here so the pipeline and models import shared
configuration rather than hardcoding values in multiple places.
"""
from pathlib import Path

# Paths used by the pipeline (strings for easy use with pandas/pathlib)
INPUT_CSV_PATH = Path("backend") / "data" / "auth_sample.csv"
OUTPUT_CSV_PATH = Path("backend") / "data" / "final_risk_scores.csv"

# Isolation Forest hyperparameters
IF_CONTAMINATION = 0.05
IF_RANDOM_STATE = 42

__all__ = [
    "INPUT_CSV_PATH",
    "OUTPUT_CSV_PATH",
    "IF_CONTAMINATION",
    "IF_RANDOM_STATE",
]
