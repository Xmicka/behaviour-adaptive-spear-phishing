import pandas as pd
from typing import Optional


def _minmax_series(s: pd.Series) -> pd.Series:
    """Min-max normalize a series to 0..1 defensively."""
    if s.empty:
        return s.astype(float)
    min_v = s.min()
    max_v = s.max()
    denom = max_v - min_v
    # If all values are identical, there is no variation to rescale.
    # Returning zeros is a safe, stable choice: it avoids division by
    # zero and represents the practical reality that no observation is
    # more extreme than another in this dimension.
    if denom == 0:
        return pd.Series(0.0, index=s.index)

    # Normal case: perform stable division. The tiny epsilon guards
    # against floating point edge-cases but the denom==0 branch above
    # already prevents true division-by-zero.
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
            # When no external ML score is provided, we expect the DataFrame
            # to contain an `anomaly_score` column produced by an upstream
            # model. If it's missing, we cannot compute the ML component.
            # Raising a ValueError here is intentional and descriptive so
            # the pipeline orchestrator can decide how to proceed.
            raise ValueError(
                "compute_risk_score: 'anomaly_score' column is required when ml_anomaly_score is not provided"
            )

        raw_ml = out["anomaly_score"]
        # Defensive: if the series is empty or has no variation, the
        # normalizer returns zeros. This can happen in real-world logs
        # when an upstream model failed to produce scores or produced a
        # constant placeholder.
        out["ml_anomaly_score"] = _minmax_series(raw_ml)
    else:
        # If a precomputed ML score Series is supplied, accept it but
        # validate its length. An empty series indicates missing ML
        # outputs and we treat that as all-equal/zeroed scores rather
        # than crashing the pipeline.
        if getattr(ml_anomaly_score, "empty", False):
            out["ml_anomaly_score"] = pd.Series(0.0, index=out.index)
        else:
            # Align provided series to the DataFrame index where possible;
            # _minmax_series will handle identical values safely.
            s = pd.Series(ml_anomaly_score, index=ml_anomaly_score.index) if not isinstance(ml_anomaly_score, pd.Series) else ml_anomaly_score
            # Reindex to df index if length differs to avoid misalignment.
            if not s.index.equals(out.index):
                s = s.reindex(out.index, fill_value=s.mean() if not s.empty else 0.0)
            out["ml_anomaly_score"] = _minmax_series(s)

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
        # Accept externally computed rule-based scores but normalise
        # defensively. If the provided series is empty or constant the
        # normaliser returns zeros rather than causing a failure.
        if getattr(rule_based_score, "empty", False):
            out["rule_based_score"] = pd.Series(0.0, index=out.index)
        else:
            srb = rule_based_score if isinstance(rule_based_score, pd.Series) else pd.Series(rule_based_score)
            if not srb.index.equals(out.index):
                srb = srb.reindex(out.index, fill_value=srb.mean() if not srb.empty else 0.0)
            out["rule_based_score"] = _minmax_series(srb)

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
    # If we reach here, the DataFrame is fully annotated with the
    # normalized components and a stable `final_risk_score`. For the
    # single-user case (n==1) the normalizers above will produce zeros
    # because there is no variation; we explicitly provide a human
    # readable reason in that scenario to aid downstream analysis.
    if out.shape[0] == 1:
        # Real-world scenario: logs from a single user (e.g., a new
        # account) do not provide comparative context. Assign a neutral
        # risk and explain why the score is uninformative.
        out.loc[:, "risk_reason"] = out.loc[:, "risk_reason"].fillna(
            "Single-user data: insufficient variation to assess deviation"
        )

    return out.sort_values("final_risk_score", ascending=False)