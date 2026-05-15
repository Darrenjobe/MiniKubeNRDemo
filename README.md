# TechMart — New Relic Full-Stack Demo on Minikube

A fully instrumented e-commerce demo application running on Minikube, designed to showcase **New Relic's complete observability platform** — from browser UX to Kubernetes infrastructure, across a realistic polyglot microservices architecture.

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

- macOS with Apple Silicon (M1/M2/M3) — ARM64
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or [OrbStack](https://orbstack.dev/)
- [Minikube](https://minikube.sigs.k8s.io/docs/start/) — `brew install minikube`
- [kubectl](https://kubernetes.io/docs/tasks/tools/) — `brew install kubectl`
- [Helm](https://helm.sh/docs/intro/install/) — `brew install helm`
- A New Relic account — [free tier available](https://newrelic.com/signup)

---

## Quick Start

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env with your keys
```

Required:
- `NEW_RELIC_LICENSE_KEY` — NR Account → API Keys → License Key
- `JWT_SECRET` — any long random string (32+ chars)

Optional (for AI chatbot):
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`

### 2. (Optional) Add NR Browser Agent snippet

In New Relic: **Add Data → Browser → Copy/paste JS snippet**

```bash
# Add to .env:
NR_BROWSER_AGENT='<script type="text/javascript">...(paste full snippet)...</script>'
```

### 3. Deploy everything

```bash
bash scripts/setup.sh
```

First run takes ~10 minutes (builds all 8 Docker images inside Minikube).

### 4. Open the app

```bash
bash scripts/port-forward.sh
# Opens http://localhost:3000
```

**Demo credentials:** `demo@nrdemo.com` / `admin123`

---

## Demo Flows

### Distributed Trace
1. Login → browse → add to cart → checkout
2. Checkout creates a cross-language trace: `api-gateway (Node) → order-service (Java) → product-service (Java) → user-service (Python)`
3. In NR: **APM → Distributed Tracing**

### Error Injection
1. Go to `/admin` → click **"Trigger NPE → Product Service"**
2. In NR: **APM → product-service → Errors** — full Java stack trace

### Latency Injection
1. `/admin` → enable **Latency Injection** (e.g., 3000ms) → **Apply**
2. Browse products — Apdex drops, slow traces appear
3. In NR: **APM → product-service → Transactions**

### AI Monitoring
1. Click 💬 (bottom right) → ask a product question
2. Switch between Claude and Gemini providers
3. In NR: **AI Monitoring** — token counts, latency, prompts, completions

### Load Test
```bash
bash scripts/load-test.sh
# Sends ~5 req/s for 2 minutes to populate NR dashboards
```

---

## Teardown

```bash
bash scripts/teardown.sh
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
└── scripts/               # setup.sh, teardown.sh, port-forward.sh, load-test.sh
```
