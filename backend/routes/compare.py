"""
GET /api/compare  — All 4 model performance metrics + ROC data
"""

from fastapi import APIRouter
from services.model_loader import load_metrics, get_available_models

router = APIRouter()


@router.get("/compare")
async def compare_models():
    metrics = load_metrics()
    available = get_available_models()

    if not metrics:
        # Return demo metrics if models not trained yet
        return {
            "status": "demo",
            "message": "Using demo data. Run train.py to see real metrics.",
            "models": get_demo_metrics()
        }

    return {
        "status": "live",
        "available_models": available,
        "models": metrics
    }


@router.get("/metrics/{model_name}")
async def get_model_metrics(model_name: str):
    metrics = load_metrics()
    if model_name not in metrics:
        return {"error": f"Metrics for '{model_name}' not found."}
    return metrics[model_name]


def get_demo_metrics():
    """Returns paper's reported metrics as fallback demo data."""
    import numpy as np

    def make_roc(auc_target):
        fpr = np.linspace(0, 1, 100).tolist()
        tpr = [min(1.0, f + auc_target * (1 - f) * 2) for f in fpr]
        return {"fpr": fpr, "tpr": tpr}

    return {
        "random_forest": {
            "model": "random_forest",
            "accuracy": 1.0,
            "precision": 1.0,
            "recall": 1.0,
            "f1_score": 1.0,
            "specificity": 1.0,
            "fpr": 0.0,
            "fnr": 0.0,
            "npv": 1.0,
            "mcc": 1.0,
            "balanced_accuracy": 1.0,
            "auc": 1.0,
            "roc_curve": make_roc(1.0),
            "confusion_matrix": {"tn": 9968, "fp": 0, "fn": 0, "tp": 10032},
            "feature_importance": [
                ["static_prio", 0.18], ["vm_truncate_count", 0.14],
                ["millisecond", 0.12], ["shared_vm", 0.10], ["nivcsw", 0.09],
                ["maj_flt", 0.08], ["end_data", 0.07], ["utime", 0.06],
                ["stime", 0.05], ["free_area_cache", 0.04]
            ]
        },
        "decision_tree": {
            "model": "decision_tree",
            "accuracy": 0.9999,
            "precision": 1.0,
            "recall": 0.99,
            "f1_score": 0.99,
            "specificity": 0.9998,
            "fpr": 0.0002,
            "fnr": 0.0,
            "npv": 1.0,
            "mcc": 0.9998,
            "balanced_accuracy": 0.9999,
            "auc": 1.0,
            "roc_curve": make_roc(0.99),
            "confusion_matrix": {"tn": 9966, "fp": 2, "fn": 0, "tp": 10032}
        },
        "knn": {
            "model": "knn",
            "accuracy": 0.9942,
            "precision": 0.99,
            "recall": 0.99,
            "f1_score": 0.99,
            "specificity": 0.9948,
            "fpr": 0.0052,
            "fnr": 0.0062,
            "npv": 0.9938,
            "mcc": 0.9886,
            "balanced_accuracy": 0.9943,
            "auc": 0.9943,
            "roc_curve": make_roc(0.97),
            "confusion_matrix": {"tn": 9916, "fp": 52, "fn": 62, "tp": 9970}
        },
        "svm": {
            "model": "svm",
            "accuracy": 0.7585,
            "precision": 0.84,
            "recall": 0.76,
            "f1_score": 0.74,
            "specificity": 0.87,
            "fpr": 0.13,
            "fnr": 0.4829,
            "npv": 0.6772,
            "mcc": 0.5917,
            "balanced_accuracy": 0.7585,
            "auc": 0.7586,
            "roc_curve": make_roc(0.72),
            "confusion_matrix": {"tn": 8700, "fp": 1300, "fn": 4829, "tp": 5171}
        }
    }
