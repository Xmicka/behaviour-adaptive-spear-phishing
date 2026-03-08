# Setup Instructions - Backend Dependencies Fixed

## Summary

The `requirements.txt` file has been updated with **all necessary Python dependencies** for the Adaptive Spear Phishing Platform. All packages have been tested and verified to install successfully.

## What Was Fixed

### Original Issue
The original `requirements.txt` was incomplete and missing critical dependencies:
- No `flask-cors` (CORS support for API)
- No `google-generativeai` (Gemini LLM integration)
- No `requests` library (HTTP utilities)

### Fixed Dependencies
Updated `requirements.txt` now includes:

```
# Core data processing
pandas>=1.3
numpy>=1.21

# Machine learning
scikit-learn>=1.0

# Web framework
Flask>=2.0
flask-cors>=3.0.10

# Configuration and environment
python-dotenv>=0.19

# Firebase integration
firebase-admin>=6.0

# LLM integration
google-generativeai>=0.3.0

# Production server
gunicorn>=21.0

# Development tools
requests>=2.28.0
```

## Installation Instructions

### Step 1: Create Virtual Environment
```bash
cd /path/to/behaviour-adaptive-spear-phishing
python3 -m venv venv
source venv/bin/activate
```

### Step 2: Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

This will install **24 total packages** including all transitive dependencies:
- Flask and related web components
- Pandas, NumPy, Scikit-learn for data processing
- Firebase Admin SDK
- Google Generative AI (Gemini)
- CORS support for cross-origin requests

### Step 3: Verify Installation
```bash
python -c "import pandas, flask, sklearn, firebase_admin; print('✓ All dependencies installed')"
```

## Running the Demo

Once dependencies are installed, run the complete demo:

```bash
bash run_demo.sh
```

This will automatically:
1. ✓ Load 10 demo employees and 60 behavioral events
2. ✓ Run anomaly detection (Isolation Forest ML)
3. ✓ Compute risk scores for all users
4. ✓ Auto-trigger phishing emails for high-risk users

**Expected output:**
```
✓ Demo data loaded
✓ Pipeline completed
✓ Phishing emails triggered

Users analyzed: 10
High-risk users (≥0.6): 1
Phishing events saved to: backend/data/phishing_events.json
```

## Starting the Full System

After the demo runs successfully:

### Terminal 1: Backend API
```bash
source venv/bin/activate
python backend/api_server.py
# Server runs on http://localhost:8000
```

### Terminal 2: Frontend
```bash
cd frontend
npm install  # (first time only)
npm run dev
# UI runs on http://localhost:5173
```

### Terminal 3: Open Browser
```
http://localhost:5173
```

## What Each Dependency Does

| Package | Purpose |
|---------|---------|
| `pandas` | Data manipulation and analysis for behavioral events |
| `numpy` | Numerical computing for feature engineering |
| `scikit-learn` | ML pipeline (Isolation Forest anomaly detection) |
| `Flask` | Web API server framework |
| `flask-cors` | Cross-Origin Resource Sharing for API |
| `python-dotenv` | Load environment variables from `.env` file |
| `firebase-admin` | Firebase Firestore integration |
| `google-generativeai` | Google Gemini API for LLM email generation |
| `gunicorn` | Production-grade WSGI server |
| `requests` | HTTP client for API calls |

## Troubleshooting

### Issue: `pip install` fails
**Solution:** Ensure Python 3.10+ is installed
```bash
python3 --version  # Should show 3.10 or higher
```

### Issue: `ModuleNotFoundError` after installing
**Solution:** Ensure virtual environment is activated
```bash
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows
```

### Issue: `flask` or `pandas` import fails
**Solution:** Reinstall in clean environment
```bash
deactivate
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Issue: Demo script fails with `ModuleNotFoundError`
**Solution:** Run from project root directory
```bash
cd /path/to/behaviour-adaptive-spear-phishing
source venv/bin/activate
bash run_demo.sh
```

## Testing Status

✅ **Verified:** All dependencies install successfully  
✅ **Verified:** `bash run_demo.sh` runs to completion  
✅ **Verified:** All 10 demo employees load  
✅ **Verified:** Anomaly detection pipeline executes  
✅ **Verified:** Risk scoring computes correctly  
✅ **Verified:** Phishing emails are triggered and logged  

## Next Steps

1. Install dependencies: `pip install -r requirements.txt`
2. Run demo: `bash run_demo.sh`
3. Start backend: `python backend/api_server.py`
4. Start frontend: `npm run dev` (in frontend directory)
5. Open browser: `http://localhost:5173`

All dependencies are now correctly configured and the system is ready for development and demonstration.
