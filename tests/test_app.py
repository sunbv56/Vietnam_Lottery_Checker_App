import pytest
from app import app
import json
from unittest.mock import patch

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_index_route(client):
    """Test standard index route loads"""
    rv = client.get('/')
    assert rv.status_code == 200
    assert b'app' in rv.data or b'html' in rv.data

@patch('app.extract_ticket_info')
@patch('app.crawl_kqxs_final')
@patch('app.check_win')
def test_check_endpoint_manual(mock_check_win, mock_crawl, mock_extract, client):
    """Test the /check endpoint with manual info"""
    # Setup mock returns
    mock_crawl.return_value = {"Giải Tám": ["56"]}
    mock_check_win.return_value = [{"name": "Giải Tám", "value": 100000}]
    
    payload = {
        "manualInfo": {
            "province": "Bến Tre",
            "date": "24-12-2025",
            "number": "123456"
        }
    }
    
    response = client.post('/check', 
                           data=json.dumps(payload),
                           content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['is_batch'] is True
    assert data['results'][0]['status'] == "OK"
    assert data['results'][0]['win_details'][0]['name'] == "Giải Tám"

@patch('app.extract_ticket_info')
def test_check_endpoint_no_data(mock_extract, client):
    """Test endpoint with missing data"""
    response = client.post('/check', 
                           data=json.dumps({}),
                           content_type='application/json')
    assert response.status_code == 400
    assert b"No data provided" in response.data
