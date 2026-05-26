from app.domain.entities import ForecastMetrics, ForecastResult, ForecastInterval
from app.infrastructure.models.forecaster import forecaster

class ForecastService:
    def calculate_forecast(self, metrics: ForecastMetrics) -> ForecastResult:
        result = forecaster.forecast_degradation_trajectory(
            current_health=metrics.current_health,
            daily_traffic=metrics.daily_traffic,
            precipitation_index=metrics.precipitation_index,
            complaints_trend=metrics.complaints_trend,
            days_since_maintenance=metrics.days_since_maintenance
        )
        
        timeline = [
            ForecastInterval(
                days_out=item["days_out"],
                projected_date=item["projected_date"],
                projected_health=item["projected_health"],
                risk_level=item["risk_level"],
                recommended_action=item["recommended_action"]
            )
            for item in result["forecast_timeline"]
        ]
        
        return ForecastResult(
            current_health=result["current_health"],
            days_to_critical_failure=result["days_to_critical_failure"],
            forecast_timeline=timeline,
            confidence_percentage=result["confidence_percentage"]
        )

forecast_service = ForecastService()
