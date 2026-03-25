"""
Model loader — loads trained .pkl files once at startup (cached)
"""

import os
import json
import joblib
from functools import lru_cache
from typing import Dict, Any

MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

MODEL_FILES = {
    "random_forest": "random_forest_model.pkl",
    "decision_tree": "decision_tree_model.pkl",
    "knn":           "knn_model.pkl",
    "svm":           "svm_model.pkl",
}


@lru_cache(maxsize=None)
def load_model(model_name: str):
    path = os.path.join(MODELS_DIR, MODEL_FILES[model_name])
    if not os.path.exists(path):
        raise FileNotFoundError(f"Model not found: {path}. Run train.py first.")
    return joblib.load(path)


@lru_cache(maxsize=None)
def load_scaler():
    path = os.path.join(MODELS_DIR, "scaler.pkl")
    if not os.path.exists(path):
        raise FileNotFoundError("Scaler not found. Run train.py first.")
    return joblib.load(path)


@lru_cache(maxsize=None)
def load_feature_names():
    path = os.path.join(MODELS_DIR, "feature_names.json")
    if not os.path.exists(path):
        raise FileNotFoundError("Feature names not found. Run train.py first.")
    with open(path) as f:
        return json.load(f)


@lru_cache(maxsize=None)
def load_metrics() -> Dict[str, Any]:
    path = os.path.join(MODELS_DIR, "metrics.json")
    if not os.path.exists(path):
        return {}
    with open(path) as f:
        return json.load(f)


def get_available_models():
    return [
        name for name, fname in MODEL_FILES.items()
        if os.path.exists(os.path.join(MODELS_DIR, fname))
    ]
