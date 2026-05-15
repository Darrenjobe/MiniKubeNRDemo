import os
import anthropic

MODEL = "claude-3-5-haiku-20241022"

# Client is created lazily so a missing/empty key doesn't crash the service
# at import time — the error surfaces only when the chat endpoint is called.
_client: anthropic.Anthropic | None = None

def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
    return _client

async def chat_with_claude(message: str, history: list, system: str) -> dict:
    messages = history + [{"role": "user", "content": message}]

    # NR AI Monitoring auto-instruments the anthropic SDK
    response = _get_client().messages.create(
        model=MODEL,
        max_tokens=1024,
        system=system,
        messages=messages,
    )

    return {
        "response": response.content[0].text,
        "provider": "claude",
        "model": MODEL,
    }
