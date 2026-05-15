import asyncio
import time
import newrelic.agent
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx, os

router = APIRouter()

# In-memory chaos state (shared across requests via module-level dict)
_chaos_state: dict = {
    "errors_enabled": False,
    "latency_enabled": False,
    "latency_ms": 2000,
    "error_rate": 0.5,   # fraction of requests that fail when errors_enabled
    "target_service": "all",
    "error_type": "500",
}

# Service URLs for triggering chaos on individual services
SERVICE_URLS = {
    "product-service": os.getenv("PRODUCT_SERVICE_URL", "http://product-service:8080"),
    "order-service":   os.getenv("ORDER_SERVICE_URL",   "http://order-service:8081"),
    "user-service":    os.getenv("USER_SERVICE_URL",    "http://user-service:8001"),
}

class ChaosConfig(BaseModel):
    errors_enabled: Optional[bool] = None
    latency_enabled: Optional[bool] = None
    latency_ms: Optional[int] = None
    error_rate: Optional[float] = None
    target_service: Optional[str] = None
    error_type: Optional[str] = None

@router.get("/status")
def get_status():
    return _chaos_state

@router.post("/configure")
async def configure_chaos(config: ChaosConfig):
    for field, value in config.dict(exclude_none=True).items():
        _chaos_state[field] = value

    newrelic.agent.add_custom_attributes([
        ("chaos.errors_enabled", str(_chaos_state["errors_enabled"])),
        ("chaos.latency_enabled", str(_chaos_state["latency_enabled"])),
        ("chaos.latency_ms", _chaos_state["latency_ms"]),
    ])

    # Push chaos config to Java services via their internal endpoint
    async with httpx.AsyncClient(timeout=5.0) as client:
        for svc_name, svc_url in SERVICE_URLS.items():
            if _chaos_state["target_service"] in ("all", svc_name):
                try:
                    await client.post(f"{svc_url}/internal/chaos", json=_chaos_state)
                except Exception as e:
                    print(f"Could not reach {svc_name}: {e}")

    return {"message": "Chaos configuration updated", "state": _chaos_state}

@router.post("/reset")
async def reset_chaos():
    _chaos_state.update({
        "errors_enabled": False,
        "latency_enabled": False,
        "latency_ms": 2000,
        "error_rate": 0.5,
        "target_service": "all",
        "error_type": "500",
    })

    async with httpx.AsyncClient(timeout=5.0) as client:
        for svc_url in SERVICE_URLS.values():
            try:
                await client.post(f"{svc_url}/internal/chaos", json=_chaos_state)
            except Exception:
                pass

    return {"message": "Chaos reset — all services healthy", "state": _chaos_state}

@router.post("/trigger-error")
async def trigger_error(service: str = "product-service"):
    """Directly trigger a test error on a downstream service for demo purposes."""
    svc_url = SERVICE_URLS.get(service)
    if not svc_url:
        raise HTTPException(status_code=400, detail=f"Unknown service: {service}")

    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            resp = await client.get(f"{svc_url}/internal/trigger-error")
            return {"triggered": True, "service": service, "response": resp.json()}
        except Exception as e:
            return {"triggered": False, "service": service, "error": str(e)}

@router.get("/services")
def list_services():
    return {
        "services": list(SERVICE_URLS.keys()),
        "error_types": ["500", "503", "timeout", "null_pointer"],
    }
