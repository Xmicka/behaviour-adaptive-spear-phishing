"""Feature extraction utilities for authentication logs.

This module provides functions to load an authentication CSV and extract
per-user behavioral features used for downstream scoring or modeling.

Expected CSV columns:
  - user
  - src_host
  - dst_host
  - timestamp
  - success (boolean-like)

Public functions:
  - load_authentication_data(path_or_buffer) -> pd.DataFrame
  - extract_user_features(df) -> pd.DataFrame
  - load_and_extract(path_or_buffer) -> pd.DataFrame

The implementation is defensive: it validates input columns, parses
timestamps, coerces the `success` column to booleans robustly, and handles
edge-cases such as users with zero events.
"""

from __future__ import annotations

import logging
from typing import Union, Iterable

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

__all__ = [
    "load_authentication_data",
    "extract_user_features",
    "load_and_extract",
]


def _validate_required_columns(df: pd.DataFrame, required: Iterable[str]) -> None:
    """Raise ValueError if any required column is missing from the DataFrame."""
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns in authentication data: {missing}")


def _coerce_success_to_bool(series: pd.Series) -> pd.Series:
    """Coerce a Series to boolean values in a robust, defensive manner.

    Accepts booleans, integers, and common string representations.
    Missing or unrecognised values are treated as False (failed).
    """

    def _to_bool(x):
        if isinstance(x, bool):
            return x
        if pd.isna(x):
            return False
        s = str(x).strip().lower()
        if s in {"true", "t", "1", "yes", "y"}:
            return True
        if s in {"false", "f", "0", "no", "n"}:
            return False
        # Try numeric conversion as a last resort
        try:
            num = float(s)
            return bool(num)
        except Exception:
            # Unknown values should not crash processing; treat as failed
            return False

    return series.map(_to_bool).astype(bool)


def load_authentication_data(path_or_buffer: Union[str, "_io.TextIOBase"]) -> pd.DataFrame:
    """Load authentication CSV data into a validated Pandas DataFrame.

    Parameters
    - path_or_buffer: path to CSV file or file-like object accepted by
      `pd.read_csv`.

    Returns
    - DataFrame with columns: `user`, `src_host`, `dst_host`, `timestamp`, `success`

    The `timestamp` column is parsed to pandas datetime and `success` is
    coerced to boolean.
    """


    # Read CSV with liberal parsing of dates; let pandas infer where possible
    try:
        df = pd.read_csv(path_or_buffer)
    except Exception as exc:
        logger.exception("Failed to read authentication CSV")
        raise

    # Accept common column name aliases to be flexible with sample data
    # e.g., some datasets use 'src'/'dst' rather than 'src_host'/'dst_host'
    if "src_host" not in df.columns and "src" in df.columns:
        df = df.rename(columns={"src": "src_host"})
    if "dst_host" not in df.columns and "dst" in df.columns:
        df = df.rename(columns={"dst": "dst_host"})

    # Validate required columns (timestamp is allowed but may be non-parsable)
    required = ["user", "src_host", "dst_host", "timestamp", "success"]
    _validate_required_columns(df, required)

    # Parse timestamps defensively. Timestamps are not required for the
    # behavioral features below, so we coerce invalid values to NaT but do
    # not raise an exception which would abort the whole pipeline.
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    n_missing_ts = df["timestamp"].isna().sum()
    if n_missing_ts > 0:
        logger.info("%d timestamp(s) could not be parsed; continuing.", n_missing_ts)

    # Coerce success to boolean
    df["success"] = _coerce_success_to_bool(df["success"])

    # Normalize column types for predictable downstream behavior
    df["user"] = df["user"].astype(str)
    df["src_host"] = df["src_host"].astype(str)
    df["dst_host"] = df["dst_host"].astype(str)

    # Optionally drop rows that clearly have no useful information
    # (defensive: keep as much data as possible; caller may filter as needed)

    return df


def extract_user_features(df: pd.DataFrame) -> pd.DataFrame:
    """Extract per-user behavioral features from authentication DataFrame.

    Parameters
    - df: DataFrame as returned by `load_authentication_data` or equivalent.

    Returns
    - DataFrame indexed by `user` with columns:
        - `login_count` (int): total number of login attempts for the user
        - `failed_login_ratio` (float): fraction of attempts that failed (0..1)
        - `unique_src_hosts` (int): count of distinct source hosts
        - `unique_dst_hosts` (int): count of distinct destination hosts

    Notes
    - Users with zero events are not present in the output. If you need to
      include a fixed user list, merge the result with that list externally.
    """

    # Validate input columns
    required = ["user", "src_host", "dst_host", "timestamp", "success"]
    _validate_required_columns(df, required)

    # Group by user and compute aggregations
    grouped = df.groupby("user").agg(
        login_count=("success", "size"),
        failed_count=("success", lambda s: (~s).sum()),
        unique_src_hosts=("src_host", pd.Series.nunique),
        unique_dst_hosts=("dst_host", pd.Series.nunique),
    )

    # Compute failed_login_ratio safely (avoid division by zero)
    grouped["failed_login_ratio"] = (
        grouped["failed_count"] / grouped["login_count"]
    ).fillna(0.0)

    # Convert to desired final column order and types
    result = grouped[["login_count", "failed_login_ratio", "unique_src_hosts", "unique_dst_hosts"]].copy()

    # Ensure integer columns are of integer dtype where safe
    int_cols = ["login_count", "unique_src_hosts", "unique_dst_hosts"]
    for col in int_cols:
        # downcast to smallest integer subtype without losing information
        result[col] = pd.to_numeric(result[col], downcast="integer")

    # failed_login_ratio should be float in range [0, 1]
    result["failed_login_ratio"] = result["failed_login_ratio"].astype(float)
    result["failed_login_ratio"] = result["failed_login_ratio"].clip(lower=0.0, upper=1.0)

    # Sort index for deterministic output
    result.sort_index(inplace=True)

    return result


def load_and_extract(path_or_buffer: Union[str, "_io.TextIOBase"]) -> pd.DataFrame:
    """Convenience function: load CSV and return extracted features.

    This is a thin wrapper around `load_authentication_data` and
    `extract_user_features` for quick usage.
    """

    df = load_authentication_data(path_or_buffer)
    return extract_user_features(df)
