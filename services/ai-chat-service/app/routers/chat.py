import os
import newrelic.agent
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.services.claude_service import chat_with_claude
from app.services.gemini_service import chat_with_gemini

router = APIRouter()

SYSTEM_PROMPT = """You are ShopBot, a friendly and knowledgeable assistant for TechMart, an online electronics store.
You help customers find products, answer questions about specifications, compare products, and assist with orders.
Keep responses concise, helpful, and focused on helping the customer find what they need.
You specialize in laptops, phones, audio equipment, smart home devices, and developer tools."""

class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    provider: Optional[str] = "claude"  # "claude" or "gemini"
    history: Optional[List[Message]] = []
    context: Optional[str] = None  # e.g., current product page context

class ChatResponse(BaseModel):
    response: str
    provider: str
    model: str

@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest):
    newrelic.agent.add_custom_attributes([
        ("chat.provider", req.provider),
        ("chat.message_length", len(req.message)),
        ("chat.history_length", len(req.history or [])),
    ])

    system = SYSTEM_PROMPT
    if req.context:
        system += f"\n\nCurrent page context: {req.context}"

    history = [{"role": m.role, "content": m.content} for m in (req.history or [])]

    try:
        if req.provider == "gemini":
            result = await chat_with_gemini(req.message, history, system)
        else:
            result = await chat_with_claude(req.message, history, system)

        return ChatResponse(
            response=result["response"],
            provider=result["provider"],
            model=result["model"],
        )
    except Exception as e:
        newrelic.agent.notice_error()
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@router.get("/providers")
def list_providers():
    return {
        "providers": [
            {"id": "claude", "name": "Claude (Anthropic)", "model": "claude-3-5-haiku-20241022"},
            {"id": "gemini", "name": "Gemini (Google)", "model": "gemini-1.5-flash"},
        ]
    }
