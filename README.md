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

## Research vs Engineering Separation

Jupyter notebooks are used here as the primary vehicle for research and
exploration because they permit rapid, iterative investigation: analysts can
compose code, run visualisations and inspect intermediate outputs inline,
which accelerates hypothesis development and feature discovery. Notebooks
are especially useful when working with LANL-style, unlabeled logs where
exploratory plots and ad-hoc aggregations guide modeling decisions.

The backend pipeline exists separately to operationalise the outcomes of
that research. By isolating data-loading, feature extraction, modelling and
scoring in a small, well-documented Python package, the project gains
repeatability, automation and a clear contract for downstream users. This
separation keeps exploratory artefacts (notebooks) distinct from the
deterministic code paths used for batch processing, validation and simple
deployment.

This pattern mirrors real-world ML workflows: researchers iterate interactively
to identify signals and validate assumptions, then engineers (or the same
researchers) extract stable logic into reproducible pipelines. The division
of concerns improves auditability, facilitates testing, and reduces the
risk that exploratory code (intended for insight) is run in uncontrolled
production contexts.
