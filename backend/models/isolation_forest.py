from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import pandas as pd
from typing import List

from backend.config import IF_CONTAMINATION, IF_RANDOM_STATE


def run_isolation_forest(features: pd.DataFrame) -> pd.DataFrame:
    """Train Isolation Forest on behavioral features and return scored DataFrame.

    This function is defensive: it checks for expected columns, handles an
    empty DataFrame, and preserves the input index (users) so downstream code
    can reference users easily.
    """

    required_cols: List[str] = [
        "login_count",
        "unique_src_hosts",
        "unique_dst_hosts",
        "failed_login_ratio",
    ]

    missing = [c for c in required_cols if c not in features.columns]
    if missing:
        raise ValueError(f"Isolation Forest: missing required feature columns: {missing}")

    if features.shape[0] == 0:
        # Return an empty frame with expected columns
        features = features.copy()
        features["anomaly_score"] = pd.Series(dtype=float)
        return features

    X = features[required_cols].astype(float)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(
        n_estimators=100,
        contamination=IF_CONTAMINATION,
        random_state=IF_RANDOM_STATE,
    )

    model.fit(X_scaled)

    # sklearn's decision_function yields higher for inliers; negate to make
    # higher = more anomalous which is convenient for risk scoring.
    features = features.copy()
    features["anomaly_score"] = -model.decision_function(X_scaled)

    return features