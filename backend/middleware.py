"""Middleware for error handling, logging, and request tracking."""
import time
import logging
from typing import Callable
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR
import traceback

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware to catch and handle all exceptions."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)
            return response
        except HTTPException as exc:
            # Let FastAPI handle HTTP exceptions
            raise exc
        except Exception as exc:
            # Log the full traceback
            logger.error(
                f"Unhandled exception: {str(exc)}\n{traceback.format_exc()}"
            )

            # Return a generic error response
            return JSONResponse(
                status_code=HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "detail": "Internal server error",
                    "message": str(exc) if logger.level == logging.DEBUG else "An unexpected error occurred"
                }
            )


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all requests and their timing."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()

        # Log request
        logger.info(
            f"Request started: {request.method} {request.url.path}"
        )

        # Process request
        response = await call_next(request)

        # Calculate duration
        duration = time.time() - start_time

        # Log response
        logger.info(
            f"Request completed: {request.method} {request.url.path} "
            f"- Status: {response.status_code} - Duration: {duration:.3f}s"
        )

        # Add timing header
        response.headers["X-Process-Time"] = str(duration)

        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiting middleware."""

    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_history: dict = {}
        self.cleanup_interval = 60  # seconds
        self.last_cleanup = time.time()

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for health check
        if request.url.path == "/api/health":
            return await call_next(request)

        # Get client identifier (IP address)
        client_ip = request.client.host if request.client else "unknown"

        # Cleanup old entries periodically
        current_time = time.time()
        if current_time - self.last_cleanup > self.cleanup_interval:
            self._cleanup_old_requests(current_time)
            self.last_cleanup = current_time

        # Check rate limit
        if self._is_rate_limited(client_ip, current_time):
            logger.warning(f"Rate limit exceeded for {client_ip}")
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."}
            )

        # Record request
        if client_ip not in self.request_history:
            self.request_history[client_ip] = []
        self.request_history[client_ip].append(current_time)

        return await call_next(request)

    def _is_rate_limited(self, client_ip: str, current_time: float) -> bool:
        """Check if client has exceeded rate limit."""
        if client_ip not in self.request_history:
            return False

        # Count requests in the last minute
        one_minute_ago = current_time - 60
        recent_requests = [
            t for t in self.request_history[client_ip]
            if t > one_minute_ago
        ]

        return len(recent_requests) >= self.requests_per_minute

    def _cleanup_old_requests(self, current_time: float):
        """Remove old request records to prevent memory bloat."""
        one_minute_ago = current_time - 60

        for client_ip in list(self.request_history.keys()):
            self.request_history[client_ip] = [
                t for t in self.request_history[client_ip]
                if t > one_minute_ago
            ]

            # Remove client if no recent requests
            if not self.request_history[client_ip]:
                del self.request_history[client_ip]
