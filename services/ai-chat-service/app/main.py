import newrelic.agent
# newrelic-admin run-program initializes the agent before module import.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat

_app = FastAPI(title="AI Chat Service", version="1.0.0")
_app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
_app.include_router(chat.router, prefix="/api/chat")

@_app.get("/health")
def health():
    return {"status": "ok", "service": "ai-chat-service"}

app = newrelic.agent.ASGIApplicationWrapper(_app)
