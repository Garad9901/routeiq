from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.image_analyzer import image_analyzer
from app.utils.logging_config import logger

router = APIRouter(prefix="/satellite", tags=["Satellite Image CV"])

@router.post("/analyze")
async def analyze_satellite_image(file: UploadFile = File(...)):
    """
    Ingests an image file (PNG/JPEG Sentinel-2 snapshot) and parses it
    using the PyTorch computer vision anomaly model.
    """
    # Verify file content-type
    if file.content_type not in ["image/png", "image/jpeg", "image/jpg", "application/octet-stream"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type: {file.content_type}. Only PNG and JPEG images are supported."
        )

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
            
        analysis_results = image_analyzer.analyze_satellite_feed(content)
        return {
            "filename": file.filename,
            "content_type": file.content_type,
            "analysis": analysis_results
        }
    except Exception as e:
        logger.error(f"Satellite CV error: {e}")
        raise HTTPException(status_code=500, detail=f"Image analysis pipeline failed: {str(e)}")
