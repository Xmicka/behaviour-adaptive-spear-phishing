#!/bin/bash

# Frontend-Backend Integration Test Script
# Tests all API endpoints and connection points

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║ Frontend-Backend Integration Test Suite   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_field=$3
    
    echo -n "🧪 Testing: $name ... "
    
    if response=$(curl -s "$url" 2>/dev/null); then
        if [ $? -eq 0 ]; then
            if [ -z "$expected_field" ] || echo "$response" | grep -q "$expected_field"; then
                echo -e "${GREEN}✓ PASS${NC}"
                TESTS_PASSED=$((TESTS_PASSED + 1))
                return 0
            else
                echo -e "${RED}✗ FAIL${NC} (Missing: $expected_field)"
                TESTS_FAILED=$((TESTS_FAILED + 1))
                return 1
            fi
        else
            echo -e "${RED}✗ FAIL${NC} (Connection error)"
            TESTS_FAILED=$((TESTS_FAILED + 1))
            return 1
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (Connection refused)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test function with JSON validation
test_json_endpoint() {
    local name=$1
    local url=$2
    
    echo -n "🧪 Testing: $name ... "
    
    if response=$(curl -s "$url" 2>/dev/null); then
        if echo "$response" | python3 -m json.tool > /dev/null 2>&1; then
            echo -e "${GREEN}✓ PASS${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
            return 0
        else
            echo -e "${RED}✗ FAIL${NC} (Invalid JSON)"
            TESTS_FAILED=$((TESTS_FAILED + 1))
            return 1
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (Connection refused)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo -e "${YELLOW}1. Testing Backend Direct Access${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Backend Health" "http://localhost:8000/api/health" "status"
test_json_endpoint "Backend Risk Summary" "http://localhost:8000/api/risk-summary"
test_json_endpoint "Backend Training Status" "http://localhost:8000/api/training-status"

echo ""
echo -e "${YELLOW}2. Testing Frontend Proxy${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Frontend Health via Proxy" "http://localhost:5173/api/health" "status"
test_json_endpoint "Frontend Risk Summary via Proxy" "http://localhost:5173/api/risk-summary"
test_json_endpoint "Frontend Training Status via Proxy" "http://localhost:5173/api/training-status"

echo ""
echo -e "${YELLOW}3. Testing Frontend Asset Delivery${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Frontend HTML" "http://localhost:5173/" "<!doctype html>" 
test_endpoint "Frontend App.tsx" "http://localhost:5173/src/App.tsx" "export" 

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Test Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo "Total:  $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "📱 Frontend: http://localhost:5173"
    echo "🔧 Backend:  http://localhost:8000"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    echo ""
    echo "Troubleshooting tips:"
    echo "1. Make sure backend is running: python3 backend/api_server.py"
    echo "2. Make sure frontend is running: cd frontend && npm run dev"
    echo "3. Check ports 5173 (frontend) and 8000 (backend) are available"
    echo "4. Check vite.config.ts has proxy configured"
    exit 1
fi

