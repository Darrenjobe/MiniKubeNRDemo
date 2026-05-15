import newrelic.agent
newrelic.agent.initialize('newrelic.ini')

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
