import time
import psycopg2
from psycopg2.extras import RealDictCursor
from motor.motor_asyncio import AsyncIOMotorClient
import redis
from app.config import settings
from app.utils.logging_config import logger

# Redis Connection Client
redis_client = None
try:
    redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
    logger.info("Successfully connected to Redis cache.")
except Exception as e:
    logger.error(f"Redis connection failed: {e}")

# MongoDB Async Motor Client
mongo_client = None
mongo_db = None
try:
    mongo_client = AsyncIOMotorClient(settings.MONGO_URL)
    # Extracts DB name from connection string, default 'routeiq'
    db_name = settings.MONGO_URL.split("/")[-1] or "routeiq"
    mongo_db = mongo_client[db_name]
    logger.info(f"Successfully connected to MongoDB. Database name: {db_name}")
except Exception as e:
    logger.error(f"MongoDB connection failed: {e}")

def get_postgres_connection():
    """
    Establishes and returns a synchronous PostgreSQL connection with a retry loop.
    Useful for quick relational query executes in the ML pipeline.
    """
    retries = 5
    while retries > 0:
        try:
            conn = psycopg2.connect(settings.DATABASE_URL, cursor_factory=RealDictCursor)
            return conn
        except psycopg2.OperationalError as e:
            logger.warning(f"PostgreSQL not ready. Retrying in 2 seconds... Error: {e}")
            retries -= 1
            time.sleep(2)
    logger.error("Failed to connect to PostgreSQL after multiple retries.")
    raise Exception("PostgreSQL database unavailable")

def get_db_cursor(conn):
    """Context-friendly cursor retriever."""
    return conn.cursor()
