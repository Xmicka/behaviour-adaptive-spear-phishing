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
import os

logger = logging.getLogger(__name__)

__all__ = [
    "load_authentication_data",
    "extract_user_features",
    "load_and_extract",
]


# Explicit list of required columns for feature extraction. Keeping this
# as a module-level constant makes it clear what the rest of the code
# expects and allows reuse in multiple functions below.
REQUIRED_COLUMNS = ["user", "src_host", "dst_host", "timestamp", "success"]


def _validate_required_columns(df: pd.DataFrame, required: Iterable[str]) -> None:
    """Validate presence of required columns and raise a clear ValueError.

    The raised ValueError contains a short, human-readable message listing
    which columns are missing and what the expected columns are. Callers
    can catch this and decide how to continue the pipeline without
    exposing raw stack traces to users.
    """

    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(
            "Authentication data is missing required column(s): "
            f"{', '.join(missing)}. Expected columns: {', '.join(REQUIRED_COLUMNS)}."
        )


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


    # If a path string was supplied, validate that the path exists for
    # a better, clearer error message. We still allow URLs (http/https)
    # and file-like objects which pandas can also accept.
    if isinstance(path_or_buffer, str):
        lower = path_or_buffer.strip().lower()
        if not (lower.startswith("http://") or lower.startswith("https://")):
            if not os.path.exists(path_or_buffer):
                # Raise a clear ValueError rather than letting pandas raise
                # a less helpful exception later. Callers can catch this
                # ValueError to avoid crashing the pipeline.
                raise ValueError(f"CSV file not found at path: {path_or_buffer}")

    # Read CSV with liberal parsing of dates; let pandas infer where possible
    try:
        df = pd.read_csv(path_or_buffer)
    except Exception as exc:
        # Surface a concise, human-readable message rather than a raw
        # stack trace. Use ValueError so callers can catch validation-type
        # problems specifically.
        logger.error("Failed to read authentication CSV: %s", exc)
        raise ValueError(f"Failed to read CSV: {exc}") from None

    # Accept common column name aliases to be flexible with sample data
    # e.g., some datasets use 'src'/'dst' rather than 'src_host'/'dst_host'
    if "src_host" not in df.columns and "src" in df.columns:
        df = df.rename(columns={"src": "src_host"})
    if "dst_host" not in df.columns and "dst" in df.columns:
        df = df.rename(columns={"dst": "dst_host"})

    # Validate required columns (timestamp is allowed but may be non-parsable)
    _validate_required_columns(df, REQUIRED_COLUMNS)

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

    # Validate input columns early to provide a clear, human-friendly
    # error message if the DataFrame is missing expected fields.
    _validate_required_columns(df, REQUIRED_COLUMNS)

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

    try:
        df = load_authentication_data(path_or_buffer)
    except ValueError as ve:
        # Input validation failed. Log a friendly message and return an
        # empty features DataFrame so the pipeline can continue without
        # crashing. The caller may decide how to handle an empty result.
        logger.error("Validation error while loading authentication data: %s", ve)
        # Construct an empty DataFrame with the expected output columns
        cols = ["login_count", "failed_login_ratio", "unique_src_hosts", "unique_dst_hosts"]
        empty = pd.DataFrame(columns=cols)
        # Use sensible dtypes for downstream code that may inspect dtypes
        empty = empty.astype({"login_count": "Int64", "unique_src_hosts": "Int64", "unique_dst_hosts": "Int64", "failed_login_ratio": "float"})
        return empty
    except Exception as exc:
        # Unexpected errors should also not crash the pipeline here.
        logger.error("Unexpected error while loading authentication data: %s", exc)
        cols = ["login_count", "failed_login_ratio", "unique_src_hosts", "unique_dst_hosts"]
        return pd.DataFrame(columns=cols)

    return extract_user_features(df)
