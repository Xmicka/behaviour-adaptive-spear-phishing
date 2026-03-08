import logging
from pathlib import Path
import pandas as pd
from pandas.errors import EmptyDataError

from backend.config import OUTPUT_CSV_PATH, COLLECTOR_DB_PATH
from backend.features.feature_extractor import extract_user_features
from backend.models.isolation_forest import run_isolation_forest
from backend.scoring.risk_score import compute_risk_score
from backend.collector.event_store import EventStore

logger = logging.getLogger(__name__)

def main():
    """Run end-to-end pipeline:
    1) Load telemetry from EventStore
    2) Extract per-user features
    3) Run Isolation Forest to compute anomaly scores
    4) Compute normalized risk score
    5) Write CSV to backend/data/final_risk_scores.csv

    This function is intentionally simple and defensive: it prints clear
    messages for common error cases (missing file, empty data, missing cols).
    """

    out_path = Path(OUTPUT_CSV_PATH)

    logger.info("Pipeline start")

    store = EventStore(str(COLLECTOR_DB_PATH))
    print(f"Loading behavioral data from {COLLECTOR_DB_PATH}")
    
    try:
        # We fetch the telemetry masquerading as authentication events for extraction
        df = store.export_to_auth_format()
        logger.info("Loaded %d behavioral event(s)", df.shape[0])
    except Exception as exc:
        logger.error("Error loading telemetry data: %s", exc)
        raise

    if df.shape[0] == 0:
        logger.warning("Event database is empty")
        print("No telemetry data found; exiting pipeline.")
        return

    print("Extracting user features...")
    features = extract_user_features(df)

    logger.info("Extracted features for %d user(s)", features.shape[0])

    if features.shape[0] == 0:
        print("No users found after feature extraction; exiting.")
        return

    logger.info("Isolation Forest training starting")
    print("Running Isolation Forest...")
    anomalies = run_isolation_forest(features)
    logger.info("Isolation Forest training completed")

    print("Computing risk scores...")
    # Preserve intermediate anomaly score as ML input and compute a simple
    # rule-based score from the features so we can return explainable
    # components alongside the final blended score.
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

    if "final_risk_score" in out_df.columns:
        scores_for_db = out_df[["user", "final_risk_score"]].to_dict("records")
        store.record_risk_scores(scores_for_db)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_df.to_csv(out_path, index=False)

    # Report how many users were written to the output file; concise and
    # human-readable for demos and simple monitoring.
    logger.info("Number of users written to output: %d", out_df.shape[0])
    logger.info("Wrote pipeline output CSV to %s", out_path)
    print(f"Pipeline completed. Results saved to {out_path}")


if __name__ == "__main__":
    # Allow running with `python -m backend.pipeline.run_pipeline`
    logging.basicConfig(level=logging.INFO)
    main()