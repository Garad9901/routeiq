from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import traceback
from app.infrastructure.logging_config import logger

class RFC7807ExceptionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            logger.error(f"Unhandled system error on path {request.url.path}: {exc}")
            logger.error(traceback.format_exc())
            
            # Formulate RFC 7807 Problem details payload
            status_code = 500
            error_payload = {
                "type": "https://routeiq-enterprise.gov/errors/internal-server-error",
                "title": "Internal Server Error",
                "status": status_code,
                "detail": str(exc),
                "instance": request.url.path
            }
            
            return JSONResponse(
                status_code=status_code,
                content=error_payload,
                headers={"Content-Type": "application/problem+json"}
            )
