#!/usr/bin/env bash
# Generates realistic traffic against the demo app to populate NR dashboards
# Usage: bash scripts/load-test.sh [--duration 300] [--url http://localhost:3000]
set -euo pipefail

BASE_URL="${2:-http://localhost:4000}"
DURATION="${1:-120}"
DELAY=0.5

GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'
info() { echo -e "${BLUE}[LOAD]${NC} $*"; }

echo -e "${GREEN}Starting load test against $BASE_URL for ${DURATION}s${NC}"

# Login and capture token
info "Authenticating..."
TOKEN=$(curl -s -X POST "$BASE_URL/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@nrdemo.com","password":"admin123"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [[ -z "$TOKEN" ]]; then
  echo "Warning: Could not get auth token — some requests will be unauthenticated"
fi

AUTH_HEADER="Authorization: Bearer $TOKEN"

run_traffic() {
  local end=$((SECONDS + DURATION))
  local request_count=0

  while [[ $SECONDS -lt $end ]]; do
    # Fetch product list
    curl -sf "$BASE_URL/api/products" -o /dev/null &

    # Fetch individual products (IDs 1-20)
    PRODUCT_ID=$((RANDOM % 20 + 1))
    curl -sf "$BASE_URL/api/products/$PRODUCT_ID" -o /dev/null &

    # Search products
    QUERIES=("laptop" "phone" "audio" "monitor" "keyboard")
    Q="${QUERIES[$((RANDOM % ${#QUERIES[@]}))]}"
    curl -sf "$BASE_URL/api/products?search=$Q" -o /dev/null &

    # Cart operations (if authenticated)
    if [[ -n "$TOKEN" ]]; then
      curl -sf -X POST "$BASE_URL/api/cart/add" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{\"productId\": $PRODUCT_ID, \"name\": \"Product $PRODUCT_ID\", \"price\": 99.99, \"quantity\": 1}" \
        -o /dev/null &

      curl -sf "$BASE_URL/api/cart" -H "$AUTH_HEADER" -o /dev/null &
    fi

    request_count=$((request_count + 5))
    printf "\r${GREEN}Requests sent: $request_count | Elapsed: ${SECONDS}s / ${DURATION}s${NC}  "
    sleep "$DELAY"
  done

  wait
  echo ""
  info "Load test complete. Total requests: ~$request_count"
}

run_traffic
