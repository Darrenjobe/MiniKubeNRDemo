import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
MODEL = "gemini-1.5-flash"

async def chat_with_gemini(message: str, history: list, system: str) -> dict:
    model = genai.GenerativeModel(model_name=MODEL, system_instruction=system)

    # Convert history to Gemini format
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
