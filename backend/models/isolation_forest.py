from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import pandas as pd
from typing import List

from backend.config import IF_CONTAMINATION, IF_RANDOM_STATE


def run_isolation_forest(features: pd.DataFrame) -> pd.DataFrame:
    """Train Isolation Forest on behavioral features and return scored DataFrame.

    Input (features):
    - A pandas DataFrame indexed by user identifiers where each row
      represents aggregated behavioral features for a single user.
    - Required columns (numeric): ``login_count``, ``unique_src_hosts``,
      ``unique_dst_hosts``, ``failed_login_ratio``.

    Output:
    - The same DataFrame augmented with an ``anomaly_score`` column where
      larger values indicate more anomalous (higher-risk) behavior. The
      score is the negated IsolationForest decision function so that
      higher == more anomalous, convenient for downstream risk blending.

    Rationale for Isolation Forest in this context:
    - LANL-style authentication logs are typically unlabeled and contain
      heterogeneous patterns. Isolation Forest is an unsupervised method
      designed to identify instances that are distinct from the bulk of
      the data without requiring labels, making it suitable for this use
      case in research and exploratory pipelines.

    Notes on reproducibility:
    - The ``random_state`` parameter controls the pseudo-random number
      generator used by the forest (subsampling, tree construction). Setting
      it yields reproducible scores across runs; leaving it unset produces
      non-deterministic but statistically equivalent results.

    The function is defensive: it validates required columns, ensures the
    input contains numeric values for those features, and raises clear
    ValueError messages for callers to handle.
    """

    required_cols: List[str] = [
        "login_count",
        "unique_src_hosts",
        "unique_dst_hosts",
        "failed_login_ratio",
    ]

    # Verify required columns are present
    missing = [c for c in required_cols if c not in features.columns]
    if missing:
        raise ValueError(f"Isolation Forest: missing required feature columns: {missing}")

    # Ensure the input DataFrame is non-empty. An empty set of user
    # aggregates provides no information to the model; raising allows the
    # pipeline orchestrator to handle this case explicitly.
    if features.shape[0] == 0:
        raise ValueError("Isolation Forest: input features DataFrame is empty")

    # Verify numeric features. Non-numeric values typically indicate
    # malformed upstream data (CSV parsing issues, header rows mixed in,
    # or accidental strings). Coerce to numeric and flag columns that
    # contain any non-convertible entries so the caller can correct data.
    non_numeric = []
    for c in required_cols:
        coerced = pd.to_numeric(features[c], errors="coerce")
        if coerced.isna().any():
            non_numeric.append(c)
    if non_numeric:
        raise ValueError(
            "Isolation Forest: expected numeric values in columns, but found non-numeric entries in: "
            f"{non_numeric}."
        )

    # At this point it's safe to cast to float for modelling
    X = features[required_cols].astype(float)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(
        n_estimators=100,
        contamination=IF_CONTAMINATION,
        random_state=IF_RANDOM_STATE,
    )

    # ``random_state`` ensures reproducibility by fixing the RNG used for
    # subsampling and tree construction. For experiments and analysis it is
    # good practice to set a seed so results are repeatable; IF_RANDOM_STATE
    # is read from configuration to make that choice explicit for runs.
    model.fit(X_scaled)

    # sklearn's decision_function yields higher for inliers; negate to make
    # higher = more anomalous which is convenient for downstream risk scoring.
    features = features.copy()
    features["anomaly_score"] = -model.decision_function(X_scaled)

    return features