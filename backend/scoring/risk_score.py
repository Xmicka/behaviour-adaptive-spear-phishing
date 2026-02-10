import pandas as pd
from typing import Optional

import pandas as pd
from typing import Optional


def _minmax_series(s: pd.Series) -> pd.Series:
    """Min-max normalize a series to 0..1 defensively."""
    if s.empty:
        return s.astype(float)
    min_v = s.min()
    max_v = s.max()
    denom = max_v - min_v
    if denom == 0:
        return pd.Series(0.0, index=s.index)
    return (s - min_v) / (denom + 1e-12)


def compute_risk_score(
    df: pd.DataFrame,
    rule_based_score: Optional[pd.Series] = None,
    ml_anomaly_score: Optional[pd.Series] = None,
) -> pd.DataFrame:
    """Compute explainable risk breakdown per user.

    Parameters
    - df: DataFrame containing at least the features used for rule-based
      scoring and/or an `anomaly_score` column produced by the Isolation
      Forest.
    - rule_based_score: optional precomputed Series of rule-based scores
      in the same index as `df`. If None, a simple rule-based score is
      computed from available columns: `failed_login_ratio`, `login_count`,
      `unique_src_hosts`, `unique_dst_hosts`.
    - ml_anomaly_score: optional precomputed ML score (higher=more anomalous).
      If None, the function will normalize `anomaly_score` from `df`.

    Returns a DataFrame with added columns:
      - `rule_based_score` (0..1)
      - `ml_anomaly_score` (0..1)
      - `final_risk_score` (0..1)
      - `risk_reason` (short human-readable explanation)

    The function keeps logic simple and explainable for research use.
    """

    if df.shape[0] == 0:
        out = df.copy()
        out["rule_based_score"] = pd.Series(dtype=float)
        out["ml_anomaly_score"] = pd.Series(dtype=float)
        out["final_risk_score"] = pd.Series(dtype=float)
        out["risk_reason"] = pd.Series(dtype=str)
        return out

    out = df.copy()

    # ML anomaly score: normalize an existing `anomaly_score` column if
    # no explicit ml_anomaly_score provided.
    if ml_anomaly_score is None:
        if "anomaly_score" not in out.columns:
            raise ValueError("compute_risk_score: 'anomaly_score' column is required when ml_anomaly_score is not provided")
        out["ml_anomaly_score"] = _minmax_series(out["anomaly_score"])
    else:
        out["ml_anomaly_score"] = _minmax_series(ml_anomaly_score)

    # Rule-based score: use provided Series or compute a simple interpretable
    # score from key behavioral metrics (weights chosen for interpretability).
    if rule_based_score is None:
        # Required columns for rule score; missing ones are treated as 0.
        failed = out["failed_login_ratio"] if "failed_login_ratio" in out.columns else pd.Series(0.0, index=out.index)
        login_cnt = out["login_count"] if "login_count" in out.columns else pd.Series(0.0, index=out.index)
        src_hosts = out["unique_src_hosts"] if "unique_src_hosts" in out.columns else pd.Series(0.0, index=out.index)
        dst_hosts = out["unique_dst_hosts"] if "unique_dst_hosts" in out.columns else pd.Series(0.0, index=out.index)

        # Normalize components to 0..1
        failed_n = _minmax_series(failed.astype(float))
        login_n = _minmax_series(login_cnt.astype(float))
        src_n = _minmax_series(src_hosts.astype(float))
        dst_n = _minmax_series(dst_hosts.astype(float))

        # Lightweight interpretable weighting
        out["rule_based_score"] = (
            0.4 * failed_n + 0.2 * login_n + 0.2 * src_n + 0.2 * dst_n
        )
    else:
        out["rule_based_score"] = _minmax_series(rule_based_score)

    # Final risk score: blend ML and rule-based explanations equally for now.
    out["final_risk_score"] = 0.5 * out["ml_anomaly_score"] + 0.5 * out["rule_based_score"]

    # Determine dominant reason using clear thresholds for explainability.
    ml = out["ml_anomaly_score"]
    rb = out["rule_based_score"]

    # Conditions are evaluated per-row; vectorized approach below.
    reason_series = pd.Series(index=out.index, dtype=object)

    both_high_mask = (ml > 0.7) & (rb > 0.7)
    ml_dom_mask = (ml >= rb) & (ml > 0.6) & (~both_high_mask)
    rb_dom_mask = (rb > ml) & (rb > 0.6) & (~both_high_mask)
    low_mask = ~(both_high_mask | ml_dom_mask | rb_dom_mask)

    reason_series[both_high_mask] = "Combined statistical anomaly and rule-based deviations"
    reason_series[ml_dom_mask] = "Behavior deviates significantly from historical baseline"
    reason_series[rb_dom_mask] = "Multiple behavioral deviations detected (frequency, access pattern, failure rate)"
    reason_series[low_mask] = "No strong evidence of deviation"

    out["risk_reason"] = reason_series.fillna("No strong evidence of deviation")

    # Sort by final risk for consistency with previous behavior
    return out.sort_values("final_risk_score", ascending=False)

    if df.shape[0] == 0:
        # Nothing to score; return empty frame with expected columns
        out = df.copy()
        out["risk_score"] = pd.Series(dtype=float)
        return out

    min_score = df["anomaly_score"].min()
    max_score = df["anomaly_score"].max()

    # Avoid division by zero when all scores are equal
    denom = (max_score - min_score)
    if denom == 0:
        # All identical scores -> assign identical risk (0.0)
        df = df.copy()
        df["risk_score"] = 0.0
        return df.sort_values("risk_score", ascending=False)

    df = df.copy()
    df["risk_score"] = (df["anomaly_score"] - min_score) / (denom + 1e-12)

    return df.sort_values("risk_score", ascending=False)