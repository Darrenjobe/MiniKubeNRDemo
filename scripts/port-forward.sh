#!/usr/bin/env bash
# Port-forward all services for local browser access
set -euo pipefail

YELLOW='\033[1;33m'; GREEN='\033[0;32m'; NC='\033[0m'

minikube profile nr-demo

echo -e "${GREEN}Starting port forwarding...${NC}"
echo -e "${YELLOW}Access the app at: http://localhost:3000${NC}"
echo "Press Ctrl+C to stop all port forwards"
echo ""

# Kill any existing port-forwards
pkill -f "kubectl port-forward" 2>/dev/null || true
sleep 1

# Forward all services
kubectl port-forward -n nr-demo svc/frontend   3000:3000 &
kubectl port-forward -n nr-demo svc/api-gateway 4000:4000 &

echo "  frontend     → http://localhost:3000"
echo "  api-gateway  → http://localhost:4000"
echo ""

# Update frontend proxy to point to local api-gateway
# (In Minikube the frontend proxies to api-gateway via ClusterIP, so no port-forward needed for internal traffic)

trap 'echo "Stopping..."; pkill -f "kubectl port-forward" 2>/dev/null; exit 0' INT TERM
wait
