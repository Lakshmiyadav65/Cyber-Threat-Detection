"""
CyberGuard AI — FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from database.db import init_db
from routes.predict import router as predict_router
from routes.explain import router as explain_router
from routes.compare import router as compare_router
from routes.history import router as history_router
from routes.upload import router as upload_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    print("✅ Database initialized")
    yield
    # Shutdown
    print("🔴 Shutting down...")


app = FastAPI(
    title="CyberGuard AI API",
    description="ML-Based Cyber Threat Detection with Explainable AI",
    version="1.0.0",
    lifespan=lifespan
)

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(predict_router, prefix="/api", tags=["Prediction"])
app.include_router(explain_router, prefix="/api", tags=["Explainability"])
app.include_router(compare_router, prefix="/api", tags=["Model Comparison"])
app.include_router(history_router, prefix="/api", tags=["History"])
app.include_router(upload_router, prefix="/api", tags=["Upload"])


@app.get("/")
async def root():
    return {
        "name": "CyberGuard AI",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
