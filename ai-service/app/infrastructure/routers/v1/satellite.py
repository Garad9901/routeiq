from fastapi import APIRouter, UploadFile, File, HTTPException
from app.domain.entities import SatelliteAnalysisResult
from app.application.services.satellite_service import satellite_service
from app.infrastructure.logging_config import logger

router = APIRouter(prefix="/v1/satellite", tags=["V1 Satellite Image CV"])

@router.post("/analyze", response_model=SatelliteAnalysisResult)
async def analyze_satellite_image(file: UploadFile = File(...)):
    if file.content_type not in ["image/png", "image/jpeg", "image/jpg", "application/octet-stream"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type: {file.content_type}. Use PNG or JPEG."
        )

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file payload is empty.")
            
        return satellite_service.analyze_image(content)
    except Exception as e:
        logger.error(f"Satellite analysis exception: {e}")
        raise HTTPException(status_code=500, detail=str(e))
