from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.infrastructure.config import settings
from app.infrastructure.middleware.exception_handler import RFC7807ExceptionMiddleware
from app.infrastructure.routers.v1 import health as health_v1, satellite as satellite_v1, forecast as forecast_v1
from app.infrastructure.logging_config import logger
from app.infrastructure.database import get_postgres_connection

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="FastAPI Production AI/ML Engine for RouteIQ smart road analysis.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Global Centralized RFC 7807 Exception Middleware
app.add_middleware(RFC7807ExceptionMiddleware)

# Versioned API routes
app.include_router(health_v1.router)
app.include_router(satellite_v1.router)
app.include_router(forecast_v1.router)

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing RouteIQ AI/ML service...")
    try:
        conn = get_postgres_connection()
        conn.close()
        logger.info("Successfully connected and validated PostgreSQL on startup.")
    except Exception as e:
        logger.error(f"PostgreSQL connection validation failed: {e}")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }

@app.get("/healthz")
def health_check():
    """Liveness probe indicator."""
    return {"status": "healthy"}
