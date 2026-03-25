"""
GET /api/history  — Scan history logs
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import json

from database.db import get_db, ScanResult

router = APIRouter()


@router.get("/history")
async def get_history(
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    prediction: Optional[str] = Query(None),
    model: Optional[str] = Query(None)
):
    query = db.query(ScanResult)

    if prediction:
        query = query.filter(ScanResult.prediction == prediction.lower())
    if model:
        query = query.filter(ScanResult.model_used == model.lower())

    total = query.count()
    records = query.order_by(ScanResult.timestamp.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "results": [
            {
                "scan_id": r.scan_id,
                "timestamp": r.timestamp.isoformat(),
                "model_used": r.model_used,
                "prediction": r.prediction,
                "confidence": round(r.confidence * 100, 2),
                "features": json.loads(r.input_features) if r.input_features else {}
            }
            for r in records
        ]
    }


@router.get("/history/stats")
async def get_stats(db: Session = Depends(get_db)):
    total = db.query(ScanResult).count()
    malware_count = db.query(ScanResult).filter(ScanResult.prediction == "malware").count()
    benign_count = db.query(ScanResult).filter(ScanResult.prediction == "benign").count()

    return {
        "total_scans": total,
        "malware_detected": malware_count,
        "benign_detected": benign_count,
        "threat_rate": round(malware_count / total * 100, 2) if total > 0 else 0
    }


@router.delete("/history/{scan_id}")
async def delete_scan(scan_id: str, db: Session = Depends(get_db)):
    record = db.query(ScanResult).filter(ScanResult.scan_id == scan_id).first()
    if not record:
        return {"error": "Not found"}
    db.delete(record)
    db.commit()
    return {"deleted": scan_id}
