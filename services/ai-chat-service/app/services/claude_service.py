import os
import anthropic

_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
MODEL = "claude-3-5-haiku-20241022"

async def chat_with_claude(message: str, history: list, system: str) -> dict:
    messages = history + [{"role": "user", "content": message}]

    # NR AI Monitoring auto-instruments the anthropic SDK — no manual instrumentation needed
    response = _client.messages.create(
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
