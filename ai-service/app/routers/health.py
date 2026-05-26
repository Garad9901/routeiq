from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, List
from app.models.health_scorer import health_scorer
from app.utils.logging_config import logger
import pandas as pd

router = APIRouter(prefix="/health", tags=["Health Scoring"])

class HealthScoreRequest(BaseModel):
    traffic_density: float = Field(..., description="Average daily traffic count.", ge=0.0)
    weather_impact: float = Field(..., description="Indexed weather severity impact factor (0-10).", ge=0.0, le=10.0)
    complaint_density: float = Field(..., description="Average complaints density count per km.", ge=0.0)
    maintenance_frequency: float = Field(..., description="Number of maintenance routines in past 2 years.", ge=0.0)
    satellite_crack_score: float = Field(..., description="Surface cracking ratio detected from CV pipeline (0-1).", ge=0.0, le=1.0)

class DriftCheckItem(BaseModel):
    traffic_density: float
    weather_impact: float
    complaint_density: float
    maintenance_frequency: float
    satellite_crack_score: float

class DriftCheckRequest(BaseModel):
    samples: List[DriftCheckItem]

@router.post("/score")
async def calculate_road_health(payload: HealthScoreRequest):
    try:
        health, confidence, explanations = health_scorer.predict_health(
            traffic_density=payload.traffic_density,
            weather_impact=payload.weather_impact,
            complaint_density=payload.complaint_density,
            maintenance_frequency=payload.maintenance_frequency,
            satellite_crack_score=payload.satellite_crack_score
        )
        return {
            "health_score": health,
            "confidence_score": confidence,
            "explainability": explanations
        }
    except Exception as e:
        logger.error(f"Error predicting road health: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/retrain")
async def trigger_retraining():
    try:
        model_path = health_scorer.retrain_model()
        return {"status": "success", "model_path": model_path, "message": "Model retrained and loaded successfully."}
    except Exception as e:
        logger.error(f"Retraining error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/drift-check")
async def check_data_drift(payload: DriftCheckRequest):
    try:
        if not payload.samples:
            raise HTTPException(status_code=400, detail="Samples list cannot be empty.")
            
        data = [s.model_dump() for s in payload.samples]
        df = pd.DataFrame(data)
        
        drift_detected = health_scorer.check_drift_and_retrain(df)
        return {
            "drift_detected": drift_detected,
            "message": "Retraining triggered due to model drift." if drift_detected else "Data distribution remains stable."
        }
    except Exception as e:
        logger.error(f"Drift check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
