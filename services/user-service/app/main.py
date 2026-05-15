import newrelic.agent
newrelic.agent.initialize('newrelic.ini')

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth

Base.metadata.create_all(bind=engine)

_app = FastAPI(title="User Service", version="1.0.0")
_app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
_app.include_router(auth.router, prefix="/api/users")

@_app.get("/health")
def health():
    return {"status": "ok", "service": "user-service"}

app = newrelic.agent.ASGIApplicationWrapper(_app)
