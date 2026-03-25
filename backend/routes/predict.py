"""
POST /api/predict  — Predict malware or benign
"""

import uuid
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
import numpy as np

from database.db import get_db, ScanResult
from services.model_loader import load_model, load_scaler, load_feature_names, get_available_models

router = APIRouter()


class PredictRequest(BaseModel):
    features: Dict[str, float]
    model: Optional[str] = "random_forest"


class PredictResponse(BaseModel):
    scan_id: str
    prediction: str            # "malware" or "benign"
    confidence: float          # probability 0.0–1.0
    model_used: str
    timestamp: str
    feature_values: Dict[str, float]


@router.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest, db: Session = Depends(get_db)):
    model_name = request.model.lower()
    available = get_available_models()

    if not available:
        raise HTTPException(
            status_code=503,
            detail="No trained models found. Please run train.py first."
        )

    if model_name not in available:
        model_name = available[0]

    try:
        model = load_model(model_name)
        scaler = load_scaler()
        feature_names = load_feature_names()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Build feature vector in correct order
    feature_vector = []
    for fname in feature_names:
        val = request.features.get(fname, 0.0)
        feature_vector.append(float(val))

    X = np.array(feature_vector).reshape(1, -1)
    X_scaled = scaler.transform(X)

    # Predict
    prediction_idx = int(model.predict(X_scaled)[0])
    prediction_label = "malware" if prediction_idx == 1 else "benign"

    # Confidence
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X_scaled)[0]
        confidence = float(proba[prediction_idx])
    else:
        confidence = 0.95 if prediction_idx == 1 else 0.97

    scan_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()

    # Save to DB
    db_record = ScanResult(
        scan_id=scan_id,
        timestamp=datetime.utcnow(),
        model_used=model_name,
        prediction=prediction_label,
        confidence=confidence,
        input_features=json.dumps(request.features)
    )
    db.add(db_record)
    db.commit()

    return PredictResponse(
        scan_id=scan_id,
        prediction=prediction_label,
        confidence=confidence,
        model_used=model_name,
        timestamp=timestamp,
        feature_values=request.features
    )


@router.get("/models")
async def get_models():
    available = get_available_models()
    return {
        "available_models": available,
        "default": "random_forest"
    }


@router.get("/features")
async def get_features():
    try:
        feature_names = load_feature_names()
        return {"features": feature_names, "count": len(feature_names)}
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="Feature names not found. Run train.py first.")
