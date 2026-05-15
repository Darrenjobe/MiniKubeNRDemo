#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────
# New Relic Demo — Rancher Desktop Setup Script
# Supports both dockerd (Moby) and containerd (nerdctl) runtimes
# Tested on macOS M2/M3 with Rancher Desktop 1.x
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
for tool in kubectl helm; do
  command -v "$tool" &>/dev/null || die "$tool not found. Install Rancher Desktop first."
done

# ─── 3. Detect container runtime ─────────────────────────────────
# Rancher Desktop exposes either docker or nerdctl depending on the runtime selected
if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
  RUNTIME="docker"
  BUILD_CMD="docker build"
  info "Detected runtime: dockerd (Moby)"
elif command -v nerdctl &>/dev/null; then
  RUNTIME="nerdctl"
  BUILD_CMD="nerdctl build --namespace k8s.io"
  info "Detected runtime: containerd (nerdctl)"
else
  die "Neither docker nor nerdctl found. Is Rancher Desktop running?"
fi

# ─── 4. Switch kubectl context to rancher-desktop ─────────────────
info "Setting kubectl context to rancher-desktop..."
kubectl config use-context rancher-desktop 2>/dev/null || \
  die "rancher-desktop context not found. Is Rancher Desktop running with Kubernetes enabled?"
success "kubectl context: rancher-desktop"

# Verify the cluster is reachable
kubectl cluster-info --request-timeout=10s &>/dev/null || \
  die "Cannot reach the Rancher Desktop cluster. Is Kubernetes enabled in Rancher Desktop preferences?"

# ─── 5. Build Docker images ───────────────────────────────────────
SERVICES=(frontend api-gateway user-service product-service cart-service order-service ai-chat-service admin-service)

info "Building Docker images (first run takes 5-10 minutes)..."
for svc in "${SERVICES[@]}"; do
  info "  Building nr-demo/$svc..."
  if [[ "$RUNTIME" == "nerdctl" ]]; then
    # containerd: build directly into the k8s.io namespace so k3s can see it
    nerdctl build \
      --namespace k8s.io \
      --platform linux/arm64 \
      -t "nr-demo/$svc:latest" \
      "$ROOT/services/$svc" 2>&1 | tail -3
  else
    # dockerd: images built here are visible to k3s when imagePullPolicy=Never
    docker build \
      --platform linux/arm64 \
      -t "nr-demo/$svc:latest" \
      "$ROOT/services/$svc" 2>&1 | tail -3
  fi
  success "  Built nr-demo/$svc"
done

# ─── 6. Create Kubernetes namespace & ConfigMaps ──────────────────
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

# ─── 7. Create Secrets ────────────────────────────────────────────
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

# ─── 8. Deploy infrastructure ─────────────────────────────────────
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

# ─── 9. Deploy all application services ───────────────────────────
info "Deploying application services..."
for dir in api-gateway user-service product-service cart-service order-service ai-chat-service admin-service frontend; do
  kubectl apply -f "$ROOT/k8s/$dir/deployment.yaml"
  kubectl apply -f "$ROOT/k8s/$dir/service.yaml"
done
success "All manifests applied"

# ─── 10. Wait for all deployments ─────────────────────────────────
info "Waiting for all deployments (Java services take ~2 minutes)..."
for svc in frontend api-gateway user-service product-service cart-service order-service ai-chat-service admin-service; do
  kubectl rollout status "deployment/$svc" -n nr-demo --timeout=300s && \
    success "  $svc ready" || warn "  $svc not ready yet (kubectl logs -n nr-demo deploy/$svc)"
done

# ─── 11. Install New Relic Kubernetes integration ──────────────────
info "Installing New Relic Kubernetes integration via Helm..."
helm repo add newrelic https://helm-charts.newrelic.com 2>/dev/null || true
helm repo update

helm upgrade --install newrelic-bundle newrelic/nri-bundle \
  --namespace newrelic \
  --create-namespace \
  --set global.licenseKey="$NEW_RELIC_LICENSE_KEY" \
  --set global.cluster="nr-demo-rancher" \
  --set newrelic-infrastructure.enabled=true \
  --set nri-metadata-injection.enabled=true \
  --set nri-kube-events.enabled=true \
  --set newrelic-logging.enabled=true \
  --set kube-state-metrics.enabled=true \
  --set global.lowDataMode=true \
  2>&1 | tail -5
success "New Relic K8s integration installed"

# ─── 12. Print access information ─────────────────────────────────
# Rancher Desktop exposes NodePorts directly on localhost — no minikube tunnel needed
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  NR Demo is UP on Rancher Desktop! 🚀${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo "  NodePorts are exposed directly on localhost:"
echo -e "  App:         ${YELLOW}http://localhost:30300${NC}"
echo -e "  API Gateway: ${YELLOW}http://localhost:30400${NC}"
echo ""
echo "  Or use port-forward for clean URLs:"
echo -e "  ${YELLOW}bash scripts/port-forward.sh${NC}  →  http://localhost:3000"
echo ""
echo "  Demo login: demo@nrdemo.com / admin123"
echo "  Admin panel: http://localhost:30300/admin"
echo ""
echo "  New Relic:  https://one.newrelic.com"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
