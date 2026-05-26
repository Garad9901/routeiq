from app.domain.entities import HealthScoringMetrics, ScoringResult
from app.infrastructure.models.health_scorer import health_scorer
import pandas as pd

class HealthScoringService:
    def calculate_health(self, metrics: HealthScoringMetrics) -> ScoringResult:
        health, confidence, explanations = health_scorer.predict_health(
            traffic_density=metrics.traffic_density,
            weather_impact=metrics.weather_impact,
            complaint_density=metrics.complaint_density,
            maintenance_frequency=metrics.maintenance_frequency,
            satellite_crack_score=metrics.satellite_crack_score
        )
        return ScoringResult(
            health_score=health,
            confidence_score=confidence,
            explainability=explanations
        )

    def trigger_retraining(self) -> str:
        return health_scorer.retrain_model()

    def check_drift(self, samples: list) -> bool:
        df = pd.DataFrame([s.dict() for s in samples])
        return health_scorer.check_drift_and_retrain(df)

health_service = HealthScoringService()
