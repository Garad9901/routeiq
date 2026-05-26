from fastapi import APIRouter, HTTPException
from app.domain.entities import ForecastMetrics, ForecastResult
from app.application.services.forecast_service import forecast_service
from app.infrastructure.logging_config import logger

router = APIRouter(prefix="/v1/forecast", tags=["V1 Degradation Forecasting"])

@router.post("/predict", response_model=ForecastResult)
async def forecast_degradation(payload: ForecastMetrics):
    try:
        return forecast_service.calculate_forecast(payload)
    except Exception as e:
        logger.error(f"Degradation forecasting failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
