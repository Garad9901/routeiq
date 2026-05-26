import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "RouteIQ AI Service"
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    
    # Databases
    DATABASE_URL: str = Field(default="postgresql://routeiq_user:routeiq_password@localhost:5432/routeiq_db")
    MONGO_URL: str = Field(default="mongodb://localhost:27017/routeiq")
    REDIS_URL: str = Field(default="redis://localhost:6379/0")

    # ML Configs
    MODEL_REGISTRY_PATH: str = "./models_registry"

    # API Keys
    OPENWEATHERMAP_API_KEY: str = Field(default="")
    GOOGLE_MAPS_API_KEY: str = Field(default="")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
