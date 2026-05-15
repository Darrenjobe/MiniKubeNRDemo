#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────
# New Relic Demo — Minikube Setup Script
# Tested on macOS M2/M3 with Docker Desktop or OrbStack
# ─────────────────────────────────────────────────────────────────

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
die()     { echo -e "${RED}[ERR]${NC}  $*"; exit 1; }

# ─── 1. Load environment variables ───────────────────────────────
if [[ ! -f "$ENV_FILE" ]]; then
  die ".env file not found. Copy .env.example to .env and fill in your keys."
fi
set -a; source "$ENV_FILE"; set +a

[[ -z "${NEW_RELIC_LICENSE_KEY:-}" || "$NEW_RELIC_LICENSE_KEY" == *"your_"* ]] && \
  die "NEW_RELIC_LICENSE_KEY is not set in .env"

info "New Relic License Key detected (${NEW_RELIC_LICENSE_KEY:0:8}...)"

# ─── 2. Check prerequisites ──────────────────────────────────────
for tool in minikube kubectl docker helm; do
  command -v "$tool" &>/dev/null || die "$tool is not installed. Please install it first."
done
success "All prerequisites found"

# ─── 3. Start Minikube ───────────────────────────────────────────
info "Starting Minikube (CPUs=6, Memory=12g, Driver=docker)..."
minikube start \
  --cpus=6 \
  --memory=12g \
  --driver=docker \
  --container-runtime=containerd \
  --kubernetes-version=stable \
  --profile=nr-demo \
  || warn "Minikube already running, continuing..."

minikube profile nr-demo
eval "$(minikube docker-env --profile=nr-demo)"
success "Minikube running"

# ─── 4. Build Docker images inside Minikube ──────────────────────
SERVICES=(frontend api-gateway user-service product-service cart-service order-service ai-chat-service admin-service)

info "Building Docker images (this takes 5-10 minutes on first run)..."
for svc in "${SERVICES[@]}"; do
  info "  Building nr-demo/$svc..."
  docker build -t "nr-demo/$svc:latest" "$ROOT/services/$svc" \
    --build-arg BUILDPLATFORM=linux/arm64 \
    --platform linux/arm64 \
    2>&1 | tail -3
  success "  Built nr-demo/$svc"
done

# ─── 5. Create Kubernetes namespace & ConfigMaps ─────────────────
info "Applying namespace..."
kubectl apply -f "$ROOT/k8s/namespace.yaml"

info "Creating postgres init ConfigMap from SQL files..."
kubectl create configmap postgres-init \
  --from-file="$ROOT/db/init/01_schema.sql" \
  --from-file="$ROOT/db/init/02_seed.sql" \
  --namespace=nr-demo \
  --dry-run=client -o yaml | kubectl apply -f -

info "Applying ConfigMap..."
kubectl apply -f "$ROOT/k8s/configmap.yaml"

# ─── 6. Create Secrets ───────────────────────────────────────────
info "Creating Kubernetes secrets from .env..."
kubectl create secret generic nr-demo-secrets \
  --namespace=nr-demo \
  --from-literal=NEW_RELIC_LICENSE_KEY="${NEW_RELIC_LICENSE_KEY}" \
  --from-literal=JWT_SECRET="${JWT_SECRET:-change_me_jwt_secret_32chars!!}" \
  --from-literal=POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-nrdemo_password_123}" \
  --from-literal=ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}" \
  --from-literal=GEMINI_API_KEY="${GEMINI_API_KEY:-}" \
  --from-literal=NR_BROWSER_AGENT="${NR_BROWSER_AGENT:-}" \
  --dry-run=client -o yaml | kubectl apply -f -
success "Secrets created"

# ─── 7. Deploy infrastructure ────────────────────────────────────
info "Deploying PostgreSQL..."
kubectl apply -f "$ROOT/k8s/postgres/pvc.yaml"
kubectl apply -f "$ROOT/k8s/postgres/deployment.yaml"
kubectl apply -f "$ROOT/k8s/postgres/service.yaml"

info "Deploying Redis..."
kubectl apply -f "$ROOT/k8s/redis/deployment.yaml"
kubectl apply -f "$ROOT/k8s/redis/service.yaml"

info "Waiting for PostgreSQL to be ready..."
kubectl rollout status deployment/postgres -n nr-demo --timeout=120s
success "PostgreSQL ready"

# ─── 8. Deploy all application services ──────────────────────────
info "Deploying application services..."
for dir in api-gateway user-service product-service cart-service order-service ai-chat-service admin-service frontend; do
  kubectl apply -f "$ROOT/k8s/$dir/deployment.yaml"
  kubectl apply -f "$ROOT/k8s/$dir/service.yaml"
done
success "All manifests applied"

# ─── 9. Wait for all deployments ─────────────────────────────────
info "Waiting for all deployments (may take 2-3 minutes for Java services)..."
for svc in frontend api-gateway user-service product-service cart-service order-service ai-chat-service admin-service; do
  kubectl rollout status "deployment/$svc" -n nr-demo --timeout=300s && \
    success "  $svc ready" || warn "  $svc not ready yet (check: kubectl logs -n nr-demo deploy/$svc)"
done

# ─── 10. Install New Relic Kubernetes integration ─────────────────
info "Installing New Relic Kubernetes integration via Helm..."
helm repo add newrelic https://helm-charts.newrelic.com 2>/dev/null || true
helm repo update

helm upgrade --install newrelic-bundle newrelic/nri-bundle \
  --namespace newrelic \
  --create-namespace \
  --set global.licenseKey="$NEW_RELIC_LICENSE_KEY" \
  --set global.cluster="nr-demo-minikube" \
  --set newrelic-infrastructure.enabled=true \
  --set nri-metadata-injection.enabled=true \
  --set nri-kube-events.enabled=true \
  --set newrelic-logging.enabled=true \
  --set kube-state-metrics.enabled=true \
  --set global.lowDataMode=true \
  2>&1 | tail -5
success "New Relic K8s integration installed"

# ─── 11. Print access information ────────────────────────────────
MINIKUBE_IP=$(minikube ip --profile=nr-demo)
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  NR Demo is UP! 🚀${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Run this to access the app:"
echo -e "  ${YELLOW}bash scripts/port-forward.sh${NC}"
echo ""
echo "  Then open:  http://localhost:3000"
echo ""
echo "  Demo login: demo@nrdemo.com / admin123"
echo "  Admin panel: http://localhost:3000/admin"
echo ""
echo "  New Relic:  https://one.newrelic.com"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
