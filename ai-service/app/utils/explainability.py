from typing import Dict, List, Any

def generate_health_explanations(
    traffic_density: float,
    weather_impact: float,
    complaint_density: float,
    maintenance_frequency: float,
    satellite_crack_score: float
) -> Dict[str, Any]:
    """
    Computes mock SHAP values and generates human-readable explanations
    for the road health score based on features.
    """
    # SHAP value baseline contribution: we start at 100 (perfect health)
    # Negative impacts pull score down, positive (maintenance) pushes it up
    
    # Feature inputs standard scaling simulation
    traffic_impact = -1 * min(15.0, (traffic_density / 1000.0) * 1.5) # heavier traffic pulls score down
    weather_detriment = -1 * min(20.0, weather_impact * 2.0)          # high weather risk (e.g. freeze-thaw)
    complaint_detriment = -1 * min(25.0, complaint_density * 3.0)    # complaints indicate active damage
    satellite_crack_detriment = -1 * min(30.0, satellite_crack_score * 35.0) # direct vision detection
    maintenance_benefit = min(15.0, maintenance_frequency * 3.5)     # active maintenance pushes health up

    shap_values = {
        "traffic_density": float(round(traffic_impact, 2)),
        "weather_conditions": float(round(weather_detriment, 2)),
        "citizen_complaints": float(round(complaint_detriment, 2)),
        "satellite_detections": float(round(satellite_crack_detriment, 2)),
        "maintenance_history": float(round(maintenance_benefit, 2))
    }
    
    # Generate insights based on the largest negative contributors
    sorted_factors = sorted(shap_values.items(), key=lambda x: x[1])
    
    primary_issue = "No critical degradation factors identified."
    recommendation = "Maintain routine checkups."
    
    if sorted_factors[0][1] < -5.0:
        factor_name = sorted_factors[0][0]
        if factor_name == "satellite_detections":
            primary_issue = "AI computer vision detected significant surface cracking and anomaly density from recent satellite feeds."
            recommendation = "Schedule immediate localized patching or resurfacing to prevent structural failure."
        elif factor_name == "citizen_complaints":
            primary_issue = "A surge in unresolved citizen complaints regarding potholes and road distress in this segment."
            recommendation = "Deploy a maintenance crew for a rapid physical audit and repair."
        elif factor_name == "weather_conditions":
            primary_issue = "Severe weather conditions, specifically freeze-thaw cycles and high precipitation, have weakened the foundation."
            recommendation = "Ensure adequate drainage and apply moisture-resistant seal coating."
        elif factor_name == "traffic_density":
            primary_issue = "Heavy traffic flow and high truck load stress are accelerating asphalt fatigue."
            recommendation = "Consider structural reinforcement or load restriction compliance checks."

    return {
        "shap_values": shap_values,
        "primary_issue": primary_issue,
        "recommended_action": recommendation
    }
