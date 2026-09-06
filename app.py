import os
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI(title="UNG-ORION", version="1.0.0")

SERVICE = "UNG-ORION"
DEPENDENCIES = {
    "iam": os.getenv("IAM_BASE_URL"),
    "atlas": os.getenv("ATLAS_BASE_URL"),
    "pulsar": os.getenv("PULSAR_BASE_URL"),
}

@app.get("/")
def root():
    return {
        "service": SERVICE,
        "status": "online",
        "role": "National Operations Command",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": SERVICE,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@app.get("/ready")
def ready():
    missing = [name for name, value in DEPENDENCIES.items() if not value]
    if missing:
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "service": SERVICE, "missing": missing},
        )
    return {"status": "ready", "service": SERVICE, "dependencies": list(DEPENDENCIES)}

@app.get("/v1/system/info")
def system_info():
    return {
        "service": SERVICE,
        "role": "National Operations Command",
        "dependencies": {k: bool(v) for k, v in DEPENDENCIES.items()},
    }
