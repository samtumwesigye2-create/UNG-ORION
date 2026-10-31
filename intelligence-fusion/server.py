"""UNG ORION Intelligence Fusion: local-only demonstration API.
Standard-library HTTP server. Synthetic data only; do not expose publicly.
Run: python3 intelligence-fusion/server.py
"""
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
HOST = "127.0.0.1"
PORT = int(os.getenv("UNG_FUSION_PORT", "8765"))

ENTITIES = [
    {"id": "p1", "type": "person", "label": "Person A"},
    {"id": "p2", "type": "person", "label": "Person B"},
    {"id": "d1", "type": "device", "label": "Device 01"},
    {"id": "d2", "type": "device", "label": "Device 02"},
]
EVENTS = [
    {"id": "e1", "timestamp": "2026-10-20T09:00:00Z", "type": "association",
     "source": "synthetic-demo", "subjects": ["p1", "d1"]},
    {"id": "e2", "timestamp": "2026-10-20T09:10:00Z", "type": "association",
     "source": "synthetic-demo", "subjects": ["p2", "d2"]},
    {"id": "e3", "timestamp": "2026-10-20T10:00:00Z", "type": "location",
     "source": "synthetic-demo", "subjects": ["d1"], "lat": 33.850, "lon": -84.010},
    {"id": "e4", "timestamp": "2026-10-20T10:05:00Z", "type": "location",
     "source": "synthetic-demo", "subjects": ["d2"], "lat": 33.851, "lon": -84.011},
    {"id": "e5", "timestamp": "2026-10-20T10:15:00Z", "type": "communication",
     "source": "synthetic-demo", "subjects": ["d1", "d2"]},
]

def validate_dataset(entities, events):
    ids = [e["id"] for e in entities]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate entity ID")
    event_ids = [e["id"] for e in events]
    if len(event_ids) != len(set(event_ids)):
        raise ValueError("Duplicate event ID")
    known = set(ids)
    for event in events:
        if not event.get("source") or not event.get("timestamp"):
            raise ValueError("Event provenance and timestamp required")
        if not set(event.get("subjects", [])).issubset(known):
            raise ValueError("Unknown subject reference")
        if "lat" in event or "lon" in event:
            if not (-90 <= event["lat"] <= 90 and -180 <= event["lon"] <= 180):
                raise ValueError("Invalid coordinates")
    return True

class Handler(BaseHTTPRequestHandler):
    def send_payload(self, status, payload):
        body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == "/health":
            return self.send_payload(200, {"status": "ok", "mode": "synthetic-demo"})
        if path == "/api/v1/fusion":
            return self.send_payload(200, {"entities": ENTITIES, "events": EVENTS,
                                           "synthetic": True, "schemaVersion": 1})
        if path in ("/", "/index.html"):
            content = (ROOT / "index.html").read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            return self.wfile.write(content)
        return self.send_payload(404, {"error": "Not found"})

    def do_POST(self):
        return self.send_payload(405, {"error": "Read-only demonstration"})

if __name__ == "__main__":
    validate_dataset(ENTITIES, EVENTS)
    print(f"UNG ORION Fusion demo at http://{HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
