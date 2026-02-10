import pandas as pd

def compute_risk_score(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute final risk score using normalized anomaly scores.
    """

    if "anomaly_score" not in df.columns:
        raise ValueError("compute_risk_score: 'anomaly_score' column is required")

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