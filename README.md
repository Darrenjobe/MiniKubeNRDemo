# TechMart — New Relic Full-Stack Demo

A fully instrumented e-commerce demo application designed to showcase **New Relic's complete observability platform** — from browser UX to Kubernetes infrastructure, across a realistic polyglot microservices architecture.

Runs on **Minikube** or **Rancher Desktop** on macOS (Apple Silicon).

---

## Architecture

```
Browser (NR Browser Agent)
    │
    ▼
┌─────────────┐      Node.js / Express
│ API Gateway │ ◄────────────────────── Single ingress point
└──────┬──────┘      NR Node.js Agent
       │
   ┌───┴────────────────────────────────────┐
   │              │              │           │
   ▼              ▼              ▼           ▼
┌──────────┐  ┌──────────┐  ┌────────┐  ┌──────────────┐
│  User    │  │ Product  │  │  Cart  │  │  AI Chat Svc │
│ Service  │  │ Service  │  │Service │  │   (Python)   │
│ (Python) │  │  (Java)  │  │(Node)  │  │ Claude/Gemini│
└──────────┘  └────┬─────┘  └────────┘  └──────────────┘
                   │  calls (distributed trace)
              ┌────▼─────┐
              │  Order   │
              │ Service  │
              │  (Java)  │
              └──────────┘
                   │
          ┌────────┴────────┐
          ▼                 ▼
    ┌──────────┐      ┌──────────┐
    │PostgreSQL│      │  Redis   │
    └──────────┘      └──────────┘
```

### Services

| Service | Language | Port | NR Agent | Purpose |
|---------|----------|------|----------|---------|
| **frontend** | React + Node.js | 3000 | Browser Agent | SPA with embedded chatbot |
| **api-gateway** | Node.js/Express | 4000 | Node.js Agent | Single API entry point |
| **user-service** | Python/FastAPI | 8001 | Python Agent | Auth/JWT/users |
| **product-service** | Java/Spring Boot | 8080 | Java Agent | Product catalog |
| **cart-service** | Node.js/Express | 4001 | Node.js Agent | Cart via Redis |
| **order-service** | Java/Spring Boot | 8081 | Java Agent | Checkout + cross-service calls |
| **ai-chat-service** | Python/FastAPI | 8002 | Python + AI Mon | Claude & Gemini chatbot |
| **admin-service** | Python/FastAPI | 8003 | Python Agent | Chaos injection panel |

### New Relic Features Demonstrated

- **APM** — Java, Node.js, and Python agents with automatic instrumentation
- **Distributed Tracing** — Full trace: browser → gateway → order → product (Java-to-Java) → user (Java-to-Python)
- **Logs in Context** — Structured logs from all services correlated to traces
- **Browser Monitoring** — Real User Monitoring (RUM) via NR Browser Agent snippet
- **AI Monitoring** — LLM token counts, prompts, completions for Claude + Gemini calls
- **Kubernetes Monitoring** — Node, pod, and namespace metrics via nri-bundle Helm chart
- **Error Tracking** — Stack traces from chaos-injected NullPointerExceptions
- **Service Map** — Auto-discovered topology across all 8 services

---

## Prerequisites

**All setups require:**
- macOS with Apple Silicon (M1/M2/M3)
- [Helm](https://helm.sh/docs/intro/install/) — `brew install helm`
- A New Relic account — [free tier available](https://newrelic.com/signup)

**Minikube setup additionally requires:**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or [OrbStack](https://orbstack.dev/)
- [Minikube](https://minikube.sigs.k8s.io/docs/start/) — `brew install minikube`
- [kubectl](https://kubernetes.io/docs/tasks/tools/) — `brew install kubectl`

**Rancher Desktop setup additionally requires:**
- [Rancher Desktop](https://rancherdesktop.io) — includes kubectl, nerdctl, and Kubernetes (k3s)

---

## Quick Start

### Step 1 — Configure environment

```bash
cp .env.example .env
# Edit .env with your keys
```

Required:
- `NEW_RELIC_LICENSE_KEY` — NR Account → API Keys → License Key
- `JWT_SECRET` — any random string, 32+ characters

Optional (for AI chatbot):
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`

### Step 2 — (Optional) Add NR Browser Agent snippet

In New Relic UI: **Add Data → Browser → Copy/paste JS snippet**

```bash
# Add to .env:
NR_BROWSER_AGENT='<script type="text/javascript">...(paste full snippet here)...</script>'
```

### Step 3 — Deploy

Choose your local Kubernetes platform:

---

#### Option A: Minikube

```bash
bash scripts/setup.sh
```

Starts a dedicated `nr-demo` Minikube profile (6 CPUs, 12 GB RAM), builds all images inside Minikube's Docker daemon, and deploys everything.

First run takes ~10 minutes.

**Access the app:**
```bash
bash scripts/port-forward.sh
# Then open http://localhost:3000
```

---

#### Option B: Rancher Desktop

**Before running the script**, configure Rancher Desktop:

1. Open **Rancher Desktop → Preferences → Virtual Machine**
   - Set CPU: **6+** cores
   - Set Memory: **12+ GB**
2. Under **Container Engine**, choose one of:
   - **dockerd (Moby)** — recommended, works like standard Docker
   - **containerd** — the script auto-detects and uses `nerdctl` instead
3. Ensure **Kubernetes** is enabled (default: on)

```bash
bash scripts/setup-rancher.sh
```

The script auto-detects your container runtime and builds images accordingly.

**Access the app — two options:**

| Method | URL |
|--------|-----|
| NodePort (no extra step) | http://localhost:30300 |
| Port-forward (clean URLs) | `bash scripts/port-forward.sh` → http://localhost:3000 |

> **Note:** Rancher Desktop exposes NodePort services directly on `localhost`, so `http://localhost:30300` works immediately after deployment without any additional commands.

**Demo credentials:** `demo@nrdemo.com` / `admin123`

---

### Rancher Desktop — Runtime Comparison

| | dockerd (Moby) | containerd (nerdctl) |
|---|---|---|
| Image build | `docker build` | `nerdctl build --namespace k8s.io` |
| Familiar CLI | ✅ Standard Docker | ⚠ nerdctl (mostly compatible) |
| Script support | ✅ Auto-detected | ✅ Auto-detected |
| Recommendation | ✅ Easier | For advanced users |

---

## Demo Flows

### Distributed Trace
1. Login → browse → add to cart → checkout
2. Checkout creates a cross-language trace spanning 4 services and 3 languages
3. In NR: **APM → Distributed Tracing**

### Error Injection
1. Go to `/admin` → click **"Trigger NPE → Product Service"**
2. In NR: **APM → product-service → Errors** — full Java stack trace with logs

### Latency Injection
1. `/admin` → enable **Latency Injection** (e.g., 3000ms) → **Apply**
2. Browse products — Apdex drops, slow traces appear in NR
3. Restore: click **"Reset All"**

### AI Monitoring
1. Click 💬 (bottom right corner) → ask a product question
2. Toggle between **Claude** and **Gemini** using the provider buttons
3. In NR: **AI Monitoring** — token counts, latency, prompts, completions per model

### Load Test
```bash
bash scripts/load-test.sh
# Generates ~5 req/s for 2 minutes to populate NR dashboards
```

---

## Teardown

**Minikube:**
```bash
bash scripts/teardown.sh
# Deletes the nr-demo Minikube profile entirely
```

**Rancher Desktop:**
```bash
kubectl delete namespace nr-demo
helm uninstall newrelic-bundle -n newrelic
# Images remain in the local registry — remove manually if needed:
# docker rmi $(docker images 'nr-demo/*' -q)   # dockerd
# nerdctl -n k8s.io rmi $(nerdctl -n k8s.io images 'nr-demo/*' -q)  # containerd
```

---

## Project Structure

```
MiniKubeNRDemo/
├── .env.example
├── services/
│   ├── frontend/          # React SPA + Express server (Node.js, NR Browser)
│   ├── api-gateway/       # Reverse proxy (Node.js, NR Node Agent)
│   ├── user-service/      # Auth + users (Python/FastAPI, NR Python Agent)
│   ├── product-service/   # Product catalog (Java/Spring Boot, NR Java Agent)
│   ├── cart-service/      # Shopping cart + Redis (Node.js, NR Node Agent)
│   ├── order-service/     # Checkout + orders (Java/Spring Boot, NR Java Agent)
│   ├── ai-chat-service/   # Claude + Gemini chatbot (Python, NR AI Monitoring)
│   └── admin-service/     # Chaos injection panel (Python, NR Python Agent)
├── k8s/                   # Kubernetes manifests for all services
├── db/init/               # PostgreSQL schema + 20 seed products
└── scripts/
    ├── setup.sh            # Minikube deploy
    ├── setup-rancher.sh    # Rancher Desktop deploy (auto-detects docker/nerdctl)
    ├── port-forward.sh     # Expose app at localhost:3000
    ├── load-test.sh        # Traffic generator for NR dashboards
    └── teardown.sh         # Minikube teardown
```
