import os
import google.generativeai as genai

MODEL = "gemini-1.5-flash"

# Configure lazily for the same reason as claude_service — avoids import-time
# crash when GEMINI_API_KEY is not yet available in the environment.
_configured = False

def _ensure_configured():
    global _configured
    if not _configured:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
        _configured = True

async def chat_with_gemini(message: str, history: list, system: str) -> dict:
    _ensure_configured()
    model = genai.GenerativeModel(model_name=MODEL, system_instruction=system)

    gemini_history = []
    for msg in history:
        role = "user" if msg["role"] == "user" else "model"
        gemini_history.append({"role": role, "parts": [msg["content"]]})

    chat = model.start_chat(history=gemini_history)

    # NR AI Monitoring auto-instruments google-generativeai SDK
    response = chat.send_message(message)

    return {
        "response": response.text,
        "provider": "gemini",
        "model": MODEL,
    }
