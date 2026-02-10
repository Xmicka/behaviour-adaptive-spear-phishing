import logging
from pathlib import Path
import pandas as pd
from pandas.errors import EmptyDataError

from backend.features.feature_extractor import load_authentication_data, extract_user_features
from backend.models.isolation_forest import run_isolation_forest
from backend.scoring.risk_score import compute_risk_score

logger = logging.getLogger(__name__)


def main():
    """Run end-to-end pipeline:
    1) Load auth CSV
    2) Extract per-user features
    3) Run Isolation Forest to compute anomaly scores
    4) Compute normalized risk score
    5) Write CSV to backend/data/final_risk_scores.csv

    This function is intentionally simple and defensive: it prints clear
    messages for common error cases (missing file, empty data, missing cols).
    """

    data_path = Path("backend") / "data" / "auth_sample.csv"
    out_path = Path("backend") / "data" / "final_risk_scores.csv"

    if not data_path.exists():
        logger.error("Auth sample file not found: %s", data_path)
        raise FileNotFoundError(f"Auth sample file not found: {data_path}")

    print(f"Loading authentication data from {data_path}")
    try:
        df = load_authentication_data(data_path)
    except EmptyDataError:
        logger.warning("Authentication CSV is empty or has no parseable columns")
        print("No data found in auth CSV; exiting pipeline.")
        return
    except ValueError as exc:
        # load_authentication_data raises ValueError on missing columns
        logger.error("Error loading authentication data: %s", exc)
        raise

    if df.shape[0] == 0:
        logger.warning("Authentication CSV is empty")
        print("No data found in auth CSV; exiting pipeline.")
        return

    print("Extracting user features...")
    features = extract_user_features(df)

    if features.shape[0] == 0:
        print("No users found after feature extraction; exiting.")
        return

    print("Running Isolation Forest...")
    anomalies = run_isolation_forest(features)

    print("Computing risk scores...")
    results = compute_risk_score(anomalies)

    # Ensure user identity is a column for CSV output
    if results.index.name is None:
        # try to preserve a 'user' column if present
        if "user" in results.columns:
            out_df = results.reset_index(drop=True)
        else:
            out_df = results.reset_index()
    else:
        out_df = results.reset_index()

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_df.to_csv(out_path, index=False)

    print(f"Pipeline completed. Results saved to {out_path}")


if __name__ == "__main__":
    # Allow running with `python -m backend.pipeline.run_pipeline`
    logging.basicConfig(level=logging.INFO)
    main()