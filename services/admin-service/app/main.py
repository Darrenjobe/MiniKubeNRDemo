import newrelic.agent
# newrelic-admin run-program (the CMD entrypoint) initializes the agent
# automatically before this module is imported — calling initialize() again
# with a different source triggers ConfigurationError, so we omit it here.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chaos

_app = FastAPI(title="Admin Service", version="1.0.0")
_app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
_app.include_router(chaos.router, prefix="/api/admin")

@_app.get("/health")
def health():
    return {"status": "ok", "service": "admin-service"}

app = newrelic.agent.ASGIApplicationWrapper(_app)
