from app.frame_propagation import register_frame, convert_position, link_timing
import os
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen
from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="UNG-ORION", version="1.0.0")
STATIC = Path(__file__).resolve().parent / "static"
app.mount("/assets", StaticFiles(directory=STATIC), name="assets")

SERVICE = "UNG-ORION"
CONSTELLATION_BASE_URL = os.getenv("CONSTELLATION_BASE_URL", "https://ung-constellation-production.up.railway.app").rstrip("/")
NEMESIS_BASE_URL = os.getenv("NEMESIS_BASE_URL", "https://ung-nemsis-production.up.railway.app").rstrip("/")
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
        "operations_ui": "/operations",
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

@app.get("/operations", include_in_schema=False)
def operations():
    return FileResponse(STATIC / "operations.html", media_type="text/html", headers={"Cache-Control": "no-store"})

@app.get("/v1/operations/nemesis")
def operations_nemesis():
    result={"source":"UNG-NEMESIS","connected":False,"summary":None,"checked_at":datetime.now(timezone.utc).isoformat()}
    try:
        with urlopen(NEMESIS_BASE_URL+"/api",timeout=3) as response:
            meta=json.load(response)
        if meta.get("system")=="UNG-NEMESIS":
            result["connected"]=True
            result["summary"]={"status":meta.get("status"),"version":meta.get("version"),"executive_feed":NEMESIS_BASE_URL+"/v1/executive/summary"}
    except (OSError,ValueError,TypeError,KeyError): pass
    return JSONResponse(result,headers={"Cache-Control":"no-store"})

@app.get("/v1/operations/tracks")
def operations_tracks():
    # No operational feed is attached. Never represent scenario data as live telemetry.
    return JSONResponse(
        {"mode": "live", "tracks": [], "connected_sources": [], "last_updated": None},
        headers={"Cache-Control": "no-store"},
    )

def _constellation_get(path):
    # Fixed upstream paths only; never proxy a client-supplied URL or return raw edge metadata.
    with urlopen(CONSTELLATION_BASE_URL + path, timeout=3) as response:
        return json.load(response)


@app.get("/v1/operations/space")
def operations_space():
    result = {"source": "UNG-CONSTELLATION", "connected": False,
              "receiver": "unknown", "last_seen": None, "recent_receptions": 0,
              "last_reception": None, "checked_at": datetime.now(timezone.utc).isoformat()}
    try:
        health = _constellation_get("/health")
        if health.get("status") != "ok" or health.get("service") != "UNG-CONSTELLATION":
            raise ValueError("Unexpected upstream service")
        result["connected"] = True
    except (OSError, ValueError, TypeError, KeyError):
        return JSONResponse(result, headers={"Cache-Control": "no-store"})
    try:
        nodes = _constellation_get("/v1/edge/nodes").get("nodes", [])
        now = datetime.now(timezone.utc)
        seen = []
        for node in nodes if isinstance(nodes, list) else []:
            if not isinstance(node, dict) or not node.get("enabled") or not node.get("receive_only"):
                continue
            try:
                stamp = datetime.fromisoformat(node["last_seen"].replace("Z", "+00:00"))
                if stamp.tzinfo and stamp <= now:
                    seen.append(stamp)
            except (KeyError, TypeError, ValueError, AttributeError):
                continue
        if seen:
            latest = max(seen)
            result["last_seen"] = latest.isoformat()
            result["receiver"] = "active" if (now - latest).total_seconds() <= 300 else "stale"
        else:
            result["receiver"] = "no heartbeat"
    except (OSError, ValueError, TypeError, KeyError):
        pass
    try:
        archives = _constellation_get("/v1/receptions?limit=10").get("receptions", [])
        if isinstance(archives, list):
            result["recent_receptions"] = len(archives)
            if archives and isinstance(archives[0], dict):
                result["last_reception"] = archives[0].get("end_time")
    except (OSError, ValueError, TypeError, KeyError):
        pass
    return JSONResponse(result, headers={"Cache-Control": "no-store"})

@app.post("/v1/frames/register")
def ung_frame_register(body: dict):
    return register_frame(body["source"],body["destination"],body["matrix"],body.get("timestamp"),body.get("version","ung-frame-v1"))
@app.post("/v1/frames/convert")
def ung_frame_convert(body: dict):
    return convert_position(body["position"],body["source"],body["destination"])
@app.post("/v1/propagation/link")
def ung_propagation_link(body: dict):
    return link_timing(body["origin_m"],body["destination_m"],float(body.get("speed_mps",299792458.0)))
