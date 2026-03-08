#!/bin/bash
# Demo Pipeline Runner Script for Adaptive Spear Phishing Platform
# This script demonstrates the end-to-end demo workflow

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   ADAPTIVE SPEAR PHISHING PLATFORM - DEMO SETUP GUIDE      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}Python 3 not found. Please install Python 3.9+${NC}"
    exit 1
fi

echo -e "${BLUE}[1/3] Loading Demo Data${NC}"
echo "Loading 10 demo employees and behavior logs..."
python3 -m backend.scripts.load_demo_data
echo -e "${GREEN}✓ Demo data loaded${NC}"
echo ""

echo -e "${BLUE}[2/3] Running Anomaly Detection Pipeline${NC}"
echo "Processing behavioral events and computing risk scores..."
python3 -m backend.pipeline.run_pipeline
echo -e "${GREEN}✓ Pipeline completed${NC}"
echo ""

echo -e "${BLUE}[3/3] Auto-triggering Phishing Emails${NC}"
echo "Triggering emails for high-risk users (risk_score >= 0.6)..."
python3 backend/scripts/run_demo_pipeline.py --skip-load
echo -e "${GREEN}✓ Phishing emails triggered${NC}"
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   DEMO SETUP COMPLETE                                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Start the backend:   python backend/api_server.py"
echo "  2. Start the frontend:  npm run dev (in frontend/ directory)"
echo "  3. Open browser to:     http://localhost:5173"
echo ""
echo "Expected demo behavior:"
echo "  • 10 demo employees loaded"
echo "  • 2 users flagged as high-risk:"
echo "    - nirominchandrasiri@gmail.com (24 tabs on March 3)"
echo "    - akeshchandrasiri@aiesec.net (login at 2:15 AM on March 5)"
echo "  • Phishing emails auto-triggered for both users"
echo "  • Risk dashboard shows 2 high-risk users"
echo ""
