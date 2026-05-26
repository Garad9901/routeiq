from fastapi import APIRouter, HTTPException
from app.domain.entities import HealthScoringMetrics, ScoringResult
from app.application.services.health_service import health_service
from app.infrastructure.logging_config import logger
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/v1/health", tags=["V1 Health Scoring"])

class DriftCheckRequest(BaseModel):
    samples: List[HealthScoringMetrics]

@router.post("/score", response_model=ScoringResult)
async def calculate_road_health(payload: HealthScoringMetrics):
    try:
        return health_service.calculate_health(payload)
    except Exception as e:
        logger.error(f"Failed to score road health: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/retrain")
async def trigger_retraining():
    try:
        model_path = health_service.trigger_retraining()
        return {"status": "success", "model_path": model_path, "message": "Model retrained and reloaded."}
    except Exception as e:
        logger.error(f"Model retraining failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/drift-check")
async def check_data_drift(payload: DriftCheckRequest):
    try:
        if not payload.samples:
            raise HTTPException(status_code=400, detail="Samples list cannot be empty.")
        drift_detected = health_service.check_drift(payload.samples)
        return {
            "drift_detected": drift_detected,
            "message": "Retraining triggered due to model drift." if drift_detected else "Data distribution remains stable."
        }
    except Exception as e:
        logger.error(f"Drift evaluation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
