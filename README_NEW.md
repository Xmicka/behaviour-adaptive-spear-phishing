Behaviour-adaptive spear-phishing research pipeline
=================================================

A research platform for behavior-adaptive threat detection in spear-phishing campaigns, featuring:
- **Backend**: Python/Flask API for risk assessment and training decisions
- **Frontend**: Premium React/Vite dashboard with smooth animations and 3D visualization
- **Seamless Integration**: Frontend automatically proxies API calls to backend

## 🚀 Quick Start (Integrated)

### One-Command Start

```bash
# From the project root:
bash start.sh
```

This will:
1. Activate the Python virtual environment
2. Start the Flask backend on port 8000
3. Start the Vite frontend on port 5173
4. Verify all APIs are working

Then open: **http://localhost:5173** in your browser

### Manual Start (Two Terminals)

**Terminal 1 - Backend:**
```bash
source venv_backend/bin/activate
python3 backend/api_server.py
# Backend runs on http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

## 🔌 Frontend-Backend Integration

The frontend and backend are **seamlessly integrated**:

- ✅ Frontend Vite proxy automatically routes `/api/*` to backend
- ✅ CORS fully enabled on backend for cross-origin requests
- ✅ API client with automatic fallback to mock data
- ✅ All endpoints tested and working
- ✅ Zero configuration needed - just run both services!

**API Endpoints:**
- Health check: `GET /api/health`
- Risk summary: `GET /api/risk-summary`
- Training status: `GET /api/training-status`

See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for detailed documentation.

## 📋 Setup Details

### Backend Setup

1. Virtual environment is already created at `venv_backend/`
   
   If needed, recreate:
   ```bash
   python3 -m venv venv_backend
   source venv_backend/bin/activate
   pip install Flask pandas numpy scikit-learn
   ```

2. Flask API server runs on `http://localhost:8000`
   
   Start:
   ```bash
   source venv_backend/bin/activate
   python3 backend/api_server.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
npm install --legacy-peer-deps
```

2. Start the development server:

```bash
npm run dev
# Opens at http://localhost:5173
```

3. For production build:

```bash
npm run build
npm run preview
```

## 🧪 Testing the Integration

Verify that both services are working together:

```bash
bash test-integration.sh
```

This will test:
- ✅ Backend API endpoints directly
- ✅ Frontend proxy connectivity
- ✅ Frontend asset delivery
- ✅ JSON response validation

Example output:
```
✅ All tests passed!
📱 Frontend: http://localhost:5173
🔧 Backend:  http://localhost:8000
```

## 📁 Project Structure

```
behaviour-adaptive-spear-phishing/
├── backend/                 # Python Flask API
│   ├── api_server.py       # Main API server (port 8000)
│   ├── data/               # CSV data files
│   ├── models/             # Anomaly detection models
│   ├── pipeline/           # Feature extraction pipeline
│   ├── scoring/            # Risk scoring logic
│   ├── training/           # Training recommendations
│   └── features/           # Feature extraction
├── frontend/               # React Vite application
│   ├── vite.config.ts      # Proxy configuration for /api
│   ├── src/
│   │   ├── api/            # API client
│   │   ├── components/     # UI components
│   │   ├── dashboard/      # Dashboard pages
│   │   └── simulation/     # Simulation features
│   └── package.json
├── venv_backend/           # Python virtual environment
├── start.sh               # One-command startup script
├── test-integration.sh    # Integration test suite
├── INTEGRATION_GUIDE.md   # Detailed integration docs
└── README.md              # This file
```

## Architecture

### Backend Pipeline
- Loads `backend/data/auth_sample.csv`
- Extracts per-user behavioral features
- Runs an Isolation Forest to compute anomaly scores
- Normalizes anomaly scores into a `risk_score`
- Writes `backend/data/final_risk_scores.csv`

### Frontend Application
- **Landing Page**: Immersive hero with 3D shield, scroll-based content reveals
- **Dashboard**: Risk metrics, employee threat assessment, campaign tracking
- **Micro-Training**: Contextual security education modal
- Premium animations powered by Framer Motion and Three.js

For detailed frontend documentation, see [frontend/FRONTEND_DOCUMENTATION.md](./frontend/FRONTEND_DOCUMENTATION.md)

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Backend | Python 3.10+, Flask, Scikit-learn, Pandas |
| Frontend | React 18, TypeScript, Vite, Framer Motion, Three.js |
| Styling | Tailwind CSS, Custom CSS animations |
| Integration | Vite proxy, CORS headers |

## Notes

- This repository is research-focused: code is intentionally simple and defensive rather than production-grade.
- If you encounter missing dependency errors, install the packages listed in `requirements.txt` (backend) or run `npm install` (frontend).

## Research vs Engineering Separation

Jupyter notebooks are used here as the primary vehicle for research and exploration because they permit rapid, iterative investigation: analysts can compose code, run visualizations and inspect intermediate outputs inline, which accelerates hypothesis development and feature discovery. Notebooks are especially useful when working with LANL-style, unlabeled logs where exploratory plots and ad-hoc aggregations guide modeling decisions.

The backend pipeline exists separately to operationalize the outcomes of that research. By isolating data-loading, feature extraction, modeling and scoring in a small, well-documented Python package, the project gains repeatability, automation and a clear contract for downstream users. This separation keeps exploratory artefacts (notebooks) distinct from the deterministic code paths used for batch processing, validation and simple deployment.

The frontend provides a professional, production-ready interface for interacting with the research outputs, enabling real-time monitoring, employee risk assessment, and integrated security training workflows.

This pattern mirrors real-world ML workflows: researchers iterate interactively to identify signals and validate assumptions, then engineers (or the same researchers) extract stable logic into reproducible pipelines. The division of concerns improves auditability, facilitates testing, and reduces the risk that exploratory code (intended for insight) is run in uncontrolled production contexts.

