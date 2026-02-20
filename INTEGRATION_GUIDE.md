# Frontend-Backend Integration Guide

## Overview

The frontend and backend are now properly connected with seamless API communication. The frontend Vite dev server proxies all `/api/*` requests to the Flask backend running on port 8000.

## Architecture

```
Frontend (Vite) @ localhost:5173
    ↓
    └─→ Proxy: /api/* → http://localhost:8000/api/*
    ↓
Backend (Flask) @ localhost:8000
    ↓
    └─→ Data: backend/data/*.csv
```

## Connection Setup

### Frontend Configuration
- **File**: [frontend/vite.config.ts](frontend/vite.config.ts)
- **Port**: 5173
- **Proxy**: All `/api/*` routes proxied to `http://localhost:8000`
- **Fallback**: Automatic fallback to mock data if API is unavailable

### Backend Configuration
- **File**: [backend/api_server.py](backend/api_server.py)
- **Port**: 8000
- **CORS**: Fully enabled for all origins
- **Data**: Reads from `backend/data/final_risk_scores.csv`

## Starting Services

### Quick Start (One Command)
```bash
cd /Users/akeshchandrasiri/behaviour-adaptive-spear-phishing

# 1. Start backend
source venv_backend/bin/activate
python3 backend/api_server.py &

# 2. Start frontend (in another terminal)
cd frontend
npm run dev
```

### Manual Start

**Terminal 1 - Backend:**
```bash
cd /Users/akeshchandrasiri/behaviour-adaptive-spear-phishing
source venv_backend/bin/activate
python3 backend/api_server.py
```
Backend runs on: `http://localhost:8000`

**Terminal 2 - Frontend:**
```bash
cd /Users/akeshchandrasiri/behaviour-adaptive-spear-phishing/frontend
npm run dev
```
Frontend runs on: `http://localhost:5173`

## API Endpoints

All endpoints are automatically available through the frontend at `/api/*`:

### Health Check
```bash
curl http://localhost:5173/api/health
# Response: { "status": "ok", "service": "behaviour-adaptive-spear-phishing-backend" }
```

### Risk Summary
```bash
curl http://localhost:5173/api/risk-summary
# Returns: User risk scores, tiers, and recommended actions
```

### Training Status
```bash
curl http://localhost:5173/api/training-status
# Returns: Training recommendations and URLs for each user
```

## Frontend API Client

**File**: [frontend/src/api/client.ts](frontend/src/api/client.ts)

The API client automatically:
1. **Tries real API first** - Fetches from `/api/*`
2. **Falls back to mocks** - If API unavailable, uses demo data
3. **No code changes needed** - Switch between API and mocks seamlessly

Example usage in components:
```typescript
import { fetchOverview, fetchRiskSummary } from '@/api/client'

const overview = await fetchOverview()        // Real API or mock fallback
const users = await fetchRiskSummary()        // Real API or mock fallback
```

## CORS Configuration

CORS is fully enabled on the backend with:
- Origin: `*` (all origins allowed)
- Methods: GET, POST, OPTIONS
- Headers: Content-Type, Authorization

This ensures the frontend can make requests without any CORS errors.

## Troubleshooting

### Frontend shows mock data instead of real API data?
1. Check if backend is running: `curl http://localhost:8000/api/health`
2. Check if port 8000 is available: `lsof -i :8000`
3. Check backend logs: `tail backend.log`

### Port already in use?
```bash
# Kill process on port 8000
lsof -i :8000 | grep -v COMMAND | awk '{print $2}' | xargs kill -9

# Kill process on port 5173
lsof -i :5173 | grep -v COMMAND | awk '{print $2}' | xargs kill -9
```

### Backend not starting?
```bash
# Activate virtual environment
source venv_backend/bin/activate

# Check if Flask is installed
pip list | grep Flask

# Test import
python3 -c "from backend.api_server import app; print('OK')"
```

### Frontend not connecting to API?
1. Open browser DevTools (F12)
2. Check Console tab for fetch errors
3. Check Network tab to see API requests
4. Verify vite.config.ts has proxy configured

## Testing the Integration

### Test from terminal:
```bash
# Test backend directly
curl http://localhost:8000/api/health
curl http://localhost:8000/api/risk-summary

# Test through frontend proxy
curl http://localhost:5173/api/health
curl http://localhost:5173/api/risk-summary
```

### Test from browser:
1. Open `http://localhost:5173` in browser
2. Open DevTools (F12)
3. Go to Network tab
4. Interact with dashboard - should see `/api/*` requests
5. Check Console for any errors

## Production Deployment

For production, configure:

1. **Frontend** - Build and serve from backend:
   ```bash
   cd frontend
   npm run build
   # Copy dist/* to backend/static/
   ```

2. **Backend** - Serve static files:
   ```python
   from flask import send_from_directory
   
   @app.route('/', defaults={'path': ''})
   @app.route('/<path:path>')
   def serve(path):
       if path != "" and os.path.exists(f'static/{path}'):
           return send_from_directory('static', path)
       return send_from_directory('static', 'index.html')
   ```

3. **Environment** - Set production Flask settings:
   ```bash
   export FLASK_ENV=production
   export FLASK_DEBUG=0
   python3 backend/api_server.py
   ```

## Current Status

✅ **Frontend & Backend properly connected**
- Vite proxy configured for seamless API communication
- CORS fully enabled on backend
- Both services can run simultaneously without conflicts
- API client automatically falls back to mock data if needed
- All endpoints tested and working

**Frontend**: http://localhost:5173
**Backend**: http://localhost:8000
**Proxy**: /api/* → backend

