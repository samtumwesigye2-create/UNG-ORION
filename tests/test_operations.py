import re

from fastapi.testclient import TestClient
from app import app

client = TestClient(app)


def test_operations_page_and_assets():
    page = client.get('/operations')
    assert page.status_code == 200
    assert 'ORION' in page.text
    assert 'Simulated' in page.text
    assert client.get('/assets/operations.css').status_code == 200
    assert client.get('/assets/operations.js').status_code == 200
    assert 'unpkg.com' not in page.text
    assert 'uganda-basemap.svg' in page.text
    assert 'id="map-status"' in page.text
    script = client.get('/assets/operations.js').text
    referenced_ids = set(re.findall(r"\$\('([^']+)'\)", script))
    rendered_ids = set(re.findall(r'id="([^"]+)"', page.text))
    assert referenced_ids <= rendered_ids
    assert len(re.findall(r"id:'SIM-[A-Z][0-9]+',name:", script)) == 16
    basemap = client.get('/assets/uganda-basemap.svg')
    assert basemap.status_code == 200
    assert b'LAKE VICTORIA' in basemap.content
    assert b'LAKE ALBERT' in basemap.content
    hydro = client.get('/assets/uganda-hydro.json')
    assert hydro.status_code == 200
    assert any(item['name'] == 'Lake Kyoga' for item in hydro.json()['lakes'])
    geometry = client.get('/assets/uganda-map.json')
    assert geometry.status_code == 200
    assert any(item['name'] == 'Uganda' for item in geometry.json()['countries'])


def test_live_tracks_are_empty_without_a_connected_source():
    data = client.get('/v1/operations/tracks').json()
    assert data['mode'] == 'live'
    assert data['tracks'] == []
    assert data['connected_sources'] == []
    assert data['last_updated'] is None
