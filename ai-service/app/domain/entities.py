from pydantic import BaseModel, Field
from typing import Dict, List, Any

class HealthScoringMetrics(BaseModel):
    traffic_density: float = Field(..., ge=0.0)
    weather_impact: float = Field(..., ge=0.0, le=10.0)
    complaint_density: float = Field(..., ge=0.0)
    maintenance_frequency: float = Field(..., ge=0.0)
    satellite_crack_score: float = Field(..., ge=0.0, le=1.0)

class ScoringResult(BaseModel):
    health_score: float
    confidence_score: float
    explainability: Dict[str, Any]

class ForecastMetrics(BaseModel):
    current_health: float = Field(..., ge=0.0, le=100.0)
    daily_traffic: float = Field(..., ge=0.0)
    precipitation_index: float = Field(..., ge=0.0, le=10.0)
    complaints_trend: float = Field(..., ge=0.0)
    days_since_maintenance: int = Field(..., ge=0)

class ForecastInterval(BaseModel):
    days_out: int
    projected_date: str
    projected_health: float
    risk_level: str
    recommended_action: str

class ForecastResult(BaseModel):
    current_health: float
    days_to_critical_failure: int
    forecast_timeline: List[ForecastInterval]
    confidence_percentage: float

class SatelliteAnalysisResult(BaseModel):
    cracking_probability: float
    pothole_probability: float
    flooding_probability: float
    general_anomaly_probability: float
    degradation_index: float
    detected_issue: str
    severity: str
    cloud_cover_percentage: float
