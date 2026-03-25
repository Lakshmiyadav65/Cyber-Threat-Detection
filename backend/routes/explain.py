"""
POST /api/explain  — LIME + SHAP explanations for a prediction
"""

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

from services.model_loader import load_model, load_scaler, load_feature_names, get_available_models

router = APIRouter()


class ExplainRequest(BaseModel):
    features: Dict[str, float]
    model: Optional[str] = "random_forest"
    include_lime: Optional[bool] = True
    include_shap: Optional[bool] = True


@router.post("/explain")
async def explain(request: ExplainRequest):
    model_name = request.model.lower()
    available = get_available_models()

    if not available:
        raise HTTPException(status_code=503, detail="No trained models found.")

    if model_name not in available:
        model_name = available[0]

    try:
        model = load_model(model_name)
        scaler = load_scaler()
        feature_names = load_feature_names()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Build feature vector
    feature_vector = np.array([
        float(request.features.get(fname, 0.0))
        for fname in feature_names
    ]).reshape(1, -1)

    X_scaled = scaler.transform(feature_vector)

    result = {
        "model": model_name,
        "lime": None,
        "shap": None,
        "pdp": None
    }

    if request.include_lime:
        try:
            from services.lime_service import get_lime_explanation
            result["lime"] = get_lime_explanation(model, X_scaled, feature_names)
        except Exception as e:
            result["lime"] = {"error": str(e)}

    if request.include_shap:
        try:
            from services.shap_service import get_shap_explanation
            result["shap"] = get_shap_explanation(model, X_scaled, feature_names)
        except Exception as e:
            result["shap"] = {"error": str(e)}

    return result
