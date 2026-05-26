from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.models.forecaster import forecaster
from app.utils.logging_config import logger

router = APIRouter(prefix="/forecast", tags=["Degradation Forecasting"])

class ForecastRequest(BaseModel):
    current_health: float = Field(..., description="Current index score of road segment.", ge=0.0, le=100.0)
    daily_traffic: float = Field(..., description="Average daily traffic count on segment.", ge=0.0)
    precipitation_index: float = Field(..., description="Annual/monthly average precipitation index (0-10).", ge=0.0, le=10.0)
    complaints_trend: float = Field(..., description="Unresolved complaint count weight.", ge=0.0)
    days_since_maintenance: int = Field(..., description="Days elapsed since last repair works.", ge=0)

@router.post("/predict")
async def forecast_degradation(payload: ForecastRequest):
    try:
        results = forecaster.forecast_degradation_trajectory(
            current_health=payload.current_health,
            daily_traffic=payload.daily_traffic,
            precipitation_index=payload.precipitation_index,
            complaints_trend=payload.complaints_trend,
            days_since_maintenance=payload.days_since_maintenance
        )
        return results
    except Exception as e:
        logger.error(f"Forecasting error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
