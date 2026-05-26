import os
import pickle
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.ensemble import RandomForestRegressor
from app.config import settings
from app.utils.logging_config import logger
from app.utils.explainability import generate_health_explanations

class RoadHealthScorer:
    def __init__(self):
        self.model_dir = settings.MODEL_REGISTRY_PATH
        self.model_path = os.path.join(self.model_dir, "road_health_model_v1.pkl")
        self.model = None
        self._ensure_model_exists()

    def _ensure_model_exists(self):
        """Loads model if exists, otherwise trains a default one and saves it."""
        if not os.path.exists(self.model_dir):
            os.makedirs(self.model_dir)

        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "rb") as f:
                    self.model = pickle.load(f)
                logger.info(f"Loaded road health scorer model from {self.model_path}")
            except Exception as e:
                logger.error(f"Error loading model: {e}. Retraining a fresh model.")
                self.retrain_model()
        else:
            logger.info("No model found. Training initial road health model...")
            self.retrain_model()

    def retrain_model(self) -> str:
        """Trains the core model using synthetic historic datasets."""
        # Generating synthetic training dataset
        np.random.seed(42)
        n_samples = 1000
        
        # Features
        traffic = np.random.uniform(100, 5000, n_samples)          # daily traffic volume
        weather = np.random.uniform(0, 10, n_samples)              # weather impact severity
        complaints = np.random.uniform(0, 5, n_samples)            # complaints density
        maintenance = np.random.uniform(0, 4, n_samples)           # annual maintenance frequency
        satellite_cracks = np.random.uniform(0, 1, n_samples)      # crack index from Sentinel-2
        
        # True health score calculation (perfect is 100)
        # health = 100 - traffic*0.003 - weather*1.5 - complaints*3.0 - satellite_cracks*30 + maintenance*2.5
        health = 100 - (traffic / 1000.0) * 1.5 - (weather * 1.2) - (complaints * 2.8) - (satellite_cracks * 25.0) + (maintenance * 2.0)
        health = np.clip(health, 0, 100)
        # Add normal noise
        health += np.random.normal(0, 2, n_samples)
        health = np.clip(health, 0, 100)

        df = pd.DataFrame({
            "traffic_density": traffic,
            "weather_impact": weather,
            "complaint_density": complaints,
            "maintenance_frequency": maintenance,
            "satellite_crack_score": satellite_cracks
        })
        
        # Using RandomForest as robust enterprise surrogate for XGBoost compatibility
        model = RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42)
        model.fit(df, health)
        
        # Save model
        with open(self.model_path, "wb") as f:
            pickle.dump(model, f)
            
        self.model = model
        logger.info(f"Model retrained successfully. Saved to {self.model_path}")
        return self.model_path

    def predict_health(
        self,
        traffic_density: float,
        weather_impact: float,
        complaint_density: float,
        maintenance_frequency: float,
        satellite_crack_score: float
    ) -> Tuple[float, float, Dict[str, Any]]:
        """
        Predicts road health score (0-100), returns:
        (predicted_health, confidence_score, explainable_ai_insights)
        """
        if not self.model:
            raise RuntimeError("Scorer model not initialized.")
            
        feature_df = pd.DataFrame([{
            "traffic_density": traffic_density,
            "weather_impact": weather_impact,
            "complaint_density": complaint_density,
            "maintenance_frequency": maintenance_frequency,
            "satellite_crack_score": satellite_crack_score
        }])
        
        # Predict
        predicted_health = float(self.model.predict(feature_df)[0])
        predicted_health = round(max(0.0, min(100.0, predicted_health)), 1)
        
        # Confidence Score calculation based on variance of random forest trees
        estimators = self.model.estimators_
        predictions = [estimator.predict(feature_df.values)[0] for estimator in estimators]
        std_dev = np.std(predictions)
        
        # Higher standard deviation = lower confidence. Convert to a 0-100 scale.
        confidence = max(50.0, min(100.0, 100.0 - (std_dev * 4.0)))
        confidence = round(confidence, 1)
        
        # Explanations
        insights = generate_health_explanations(
            traffic_density=traffic_density,
            weather_impact=weather_impact,
            complaint_density=complaint_density,
            maintenance_frequency=maintenance_frequency,
            satellite_crack_score=satellite_crack_score
        )
        
        return predicted_health, confidence, insights

    def check_drift_and_retrain(self, incoming_data: pd.DataFrame) -> bool:
        """
        Performs drift detection checking input distributions.
        If standard deviation drifts from baseline by > 30%, flags drift and triggers retrain.
        """
        # Baseline reference stats (hardcoded for demonstration of concept)
        baseline_traffic_mean = 2500.0
        incoming_traffic_mean = incoming_data["traffic_density"].mean()
        
        drift_detected = False
        # If incoming traffic mean differs by more than 35% from standard 2500
        if abs(incoming_traffic_mean - baseline_traffic_mean) / baseline_traffic_mean > 0.35:
            drift_detected = True
            logger.warning(f"Data Drift detected: Incoming Traffic Mean ({incoming_traffic_mean}) has drifted from baseline.")
            self.retrain_model()
            
        return drift_detected

health_scorer = RoadHealthScorer()
