"""FastAPI main application for FAERS Side-Effect Radar."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from backend.api import health, drugs, compare, reactions
from backend.middleware import (
    ErrorHandlingMiddleware,
    RequestLoggingMiddleware,
    RateLimitMiddleware
)

load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="FAERS Side-Effect Radar API",
    description="API for exploring FDA Adverse Event Reporting System (FAERS) data",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add middleware (order matters - first added is outermost)
# 1. Error handling (outermost - catches all errors)
app.add_middleware(ErrorHandlingMiddleware)

# 2. Request logging
app.add_middleware(RequestLoggingMiddleware)

# 3. Rate limiting
rate_limit = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
app.add_middleware(RateLimitMiddleware, requests_per_minute=rate_limit)

# 4. CORS (innermost - handles CORS before request processing)
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(drugs.router, prefix="/api", tags=["Drugs"])
app.include_router(compare.router, prefix="/api", tags=["Compare"])
app.include_router(reactions.router, prefix="/api", tags=["Reactions"])


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "FAERS Side-Effect Radar API",
        "version": "1.0.0",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", 8000))

    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
