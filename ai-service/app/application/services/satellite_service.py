from app.domain.entities import SatelliteAnalysisResult
from app.infrastructure.models.image_analyzer import image_analyzer

class SatelliteAnalysisService:
    def analyze_image(self, file_bytes: bytes) -> SatelliteAnalysisResult:
        result = image_analyzer.analyze_satellite_feed(file_bytes)
        return SatelliteAnalysisResult(
            cracking_probability=result["cracking_probability"],
            pothole_probability=result["pothole_probability"],
            flooding_probability=result["flooding_probability"],
            general_anomaly_probability=result["general_anomaly_probability"],
            degradation_index=result["degradation_index"],
            detected_issue=result["detected_issue"],
            severity=result["severity"],
            cloud_cover_percentage=result["cloud_cover_percentage"]
        )

satellite_service = SatelliteAnalysisService()
