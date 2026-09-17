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


def test_live_tracks_are_empty_without_a_connected_source():
    data = client.get('/v1/operations/tracks').json()
    assert data['mode'] == 'live'
    assert data['tracks'] == []
    assert data['connected_sources'] == []
    assert data['last_updated'] is None
