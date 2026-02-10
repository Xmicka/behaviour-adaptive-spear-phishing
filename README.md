Behaviour-adaptive spear-phishing research pipeline
=================================================

Quick start (macOS / Linux)
---------------------------

1. Create a clean virtual environment (Python 3.10+ recommended):

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

2. Run the pipeline from the repository root (this uses package imports):

```bash
python -m backend.pipeline.run_pipeline
```

What the pipeline does
- Loads `backend/data/auth_sample.csv`
- Extracts per-user behavioral features
- Runs an Isolation Forest to compute anomaly scores
- Normalizes anomaly scores into a `risk_score`
- Writes `backend/data/final_risk_scores.csv`

Notes
- This repository is research-focused: code is intentionally simple and
	defensive rather than production-grade.
- If you encounter missing dependency errors, install the packages listed
	in `requirements.txt`.
