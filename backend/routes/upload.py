"""
POST /api/upload  — Batch CSV prediction
"""

import io
import json
import uuid
from datetime import datetime

import numpy as np
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Depends
from sqlalchemy.orm import Session

from database.db import get_db, ScanResult
from services.model_loader import load_model, load_scaler, load_feature_names, get_available_models

router = APIRouter()


@router.post("/upload")
async def batch_predict(
    file: UploadFile = File(...),
    model: str = Query("random_forest"),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    available = get_available_models()
    if not available:
        raise HTTPException(status_code=503, detail="No models found. Run train.py first.")
    if model not in available:
        model = available[0]

    content = await file.read()
    try:
        df = pd.read_csv(io.StringIO(content.decode("utf-8")))
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to parse CSV.")

    ml_model = load_model(model)
    scaler = load_scaler()
    feature_names = load_feature_names()

    # Keep only known feature columns
    missing = [f for f in feature_names if f not in df.columns]
    if len(missing) > len(feature_names) * 0.5:
        raise HTTPException(
            status_code=400,
            detail=f"Too many missing feature columns ({len(missing)} missing)."
        )

    for col in feature_names:
        if col not in df.columns:
            df[col] = 0.0

    X = df[feature_names].fillna(0).astype(float)
    X_scaled = scaler.transform(X)

    predictions = ml_model.predict(X_scaled)
    if hasattr(ml_model, "predict_proba"):
        probas = ml_model.predict_proba(X_scaled)
    else:
        probas = None

    results = []
    for i, pred in enumerate(predictions):
        label = "malware" if pred == 1 else "benign"
        confidence = float(probas[i][pred]) if probas is not None else 0.95
        scan_id = str(uuid.uuid4())

        row_features = df.iloc[i][feature_names].to_dict()

        db_record = ScanResult(
            scan_id=scan_id,
            timestamp=datetime.utcnow(),
            model_used=model,
            prediction=label,
            confidence=confidence,
            input_features=json.dumps({k: float(v) for k, v in row_features.items()})
        )
        db.add(db_record)

        results.append({
            "row": i + 1,
            "scan_id": scan_id,
            "prediction": label,
            "confidence": round(confidence * 100, 2)
        })

    db.commit()

    malware_count = sum(1 for r in results if r["prediction"] == "malware")
    return {
        "total_rows": len(results),
        "malware_detected": malware_count,
        "benign_detected": len(results) - malware_count,
        "model_used": model,
        "results": results
    }
