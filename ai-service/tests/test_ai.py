import pytest
from fastapi.testclient import TestClient
import io
from app.main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_health_check_endpoint():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_road_health_scoring():
    payload = {
        "traffic_density": 1500.0,
        "weather_impact": 4.5,
        "complaint_density": 1.2,
        "maintenance_frequency": 2.0,
        "satellite_crack_score": 0.15
    }
    response = client.post("/v1/health/score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "health_score" in data
    assert "confidence_score" in data
    assert "explainability" in data

def test_satellite_image_analysis():
    dummy_file = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82")
    response = client.post(
        "/v1/satellite/analyze",
        files={"file": ("dummy.png", dummy_file, "image/png")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "cracking_probability" in data
    assert "pothole_probability" in data
    assert "flooding_probability" in data
    assert "degradation_index" in data

def test_degradation_forecasting():
    payload = {
        "current_health": 85.0,
        "daily_traffic": 2000.0,
        "precipitation_index": 5.0,
        "complaints_trend": 1.0,
        "days_since_maintenance": 120
    }
    response = client.post("/v1/forecast/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "current_health" in data
    assert "forecast_timeline" in data
    assert "confidence_percentage" in data
    timeline = data["forecast_timeline"]
    assert len(timeline) == 3
