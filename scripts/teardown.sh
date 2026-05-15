#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
info() { echo -e "\033[0;34m[INFO]${NC} $*"; }

echo -e "${RED}This will delete the nr-demo Minikube profile and all demo data.${NC}"
read -rp "Are you sure? (yes/no): " confirm
[[ "$confirm" != "yes" ]] && { echo "Aborted."; exit 0; }

info "Removing New Relic Helm release..."
helm uninstall newrelic-bundle -n newrelic 2>/dev/null || warn "newrelic-bundle not found"

info "Deleting nr-demo namespace..."
kubectl delete namespace nr-demo --ignore-not-found=true

info "Deleting Minikube profile nr-demo..."
minikube delete --profile=nr-demo 2>/dev/null || warn "Profile not found"

info "Pruning Docker images..."
eval "$(minikube docker-env -u 2>/dev/null || true)"
docker images --filter=reference='nr-demo/*' -q | xargs docker rmi -f 2>/dev/null || true

echo -e "${GREEN}Teardown complete.${NC}"
