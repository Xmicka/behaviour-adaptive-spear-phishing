#!/bin/bash

# Behaviour-Adaptive Spear Phishing - Integrated Startup Script
# This script starts both the backend Flask server and frontend Vite dev server

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PATH="$PROJECT_ROOT/venv_backend"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "🔧 Behaviour-Adaptive Spear Phishing - Starting Services"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo -e "${YELLOW}⚠️  Killing process on port $port...${NC}"
    lsof -i :$port | grep -v COMMAND | awk '{print $2}' | xargs kill -9 2>/dev/null || true
    sleep 1
}

# Check and clear ports if needed
echo "📡 Checking ports..."
if check_port 8000; then
    echo -e "${YELLOW}Port 8000 is in use${NC}"
    kill_port 8000
fi

if check_port 5173; then
    echo -e "${YELLOW}Port 5173 is in use${NC}"
    kill_port 5173
fi

# Start Backend
echo ""
echo -e "${YELLOW}🚀 Starting Backend (Flask)...${NC}"
if [ ! -d "$VENV_PATH" ]; then
    echo -e "${RED}❌ Virtual environment not found at $VENV_PATH${NC}"
    echo "Creating virtual environment..."
    python3 -m venv "$VENV_PATH"
    source "$VENV_PATH/bin/activate"
    pip install -q Flask pandas numpy scikit-learn
else
    source "$VENV_PATH/bin/activate"
fi

cd "$BACKEND_DIR/.."
python3 backend/api_server.py > backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
echo "  URL: http://localhost:8000"
echo "  Logs: backend.log"

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend failed to start${NC}"
        exit 1
    fi
    sleep 1
done

# Start Frontend
echo ""
echo -e "${YELLOW}🎨 Starting Frontend (Vite)...${NC}"
cd "$FRONTEND_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install --legacy-peer-deps > /dev/null 2>&1
fi

npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
echo "  URL: http://localhost:5173"
echo "  Logs: frontend.log"

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}⚠️  Frontend may not be ready yet${NC}"
        break
    fi
    sleep 1
done

# Test API connection through proxy
echo ""
echo -e "${YELLOW}🔌 Testing API connection...${NC}"
sleep 1
if curl -s http://localhost:5173/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API connection verified${NC}"
    curl -s http://localhost:5173/api/health | python3 -m json.tool 2>/dev/null || true
else
    echo -e "${RED}❌ API connection failed${NC}"
fi

# Summary
echo ""
echo "=================================================="
echo -e "${GREEN}✅ Services Started Successfully${NC}"
echo "=================================================="
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:8000"
echo ""
echo "🛑 To stop services:"
echo "   kill $BACKEND_PID  # Backend"
echo "   kill $FRONTEND_PID  # Frontend"
echo ""
echo "📋 To view logs:"
echo "   tail -f backend.log   # Backend logs"
echo "   tail -f frontend.log  # Frontend logs"
echo ""
echo "🌐 Open http://localhost:5173 in your browser to start using the application"
echo ""

# Keep script running and handle cleanup
trap 'echo -e "\n${YELLOW}Shutting down...${NC}"; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' SIGINT SIGTERM

wait

