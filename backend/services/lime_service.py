"""
LIME Explanation Service
Generates local feature importance explanations for individual predictions.
"""

import numpy as np
from typing import List, Dict, Any
import lime
import lime.lime_tabular


# Global LIME explainer (built once per model call)
_lime_cache = {}


def get_lime_explanation(
    model,
    X_scaled: np.ndarray,
    feature_names: List[str],
    num_features: int = 10,
    num_samples: int = 500
) -> Dict[str, Any]:
    """
    Returns LIME explanation as structured JSON for the frontend.
    """
    model_key = id(model)

    # Build explainer with training-like background data
    if model_key not in _lime_cache:
        # Use random normal data as background (real training data would be better)
        background = np.random.randn(100, X_scaled.shape[1])
        explainer = lime.lime_tabular.LimeTabularExplainer(
            training_data=background,
            feature_names=feature_names,
            class_names=["benign", "malware"],
            mode="classification",
            kernel_width=0.75,
            verbose=False
        )
        _lime_cache[model_key] = explainer
    else:
        explainer = _lime_cache[model_key]

    # Generate explanation
    explanation = explainer.explain_instance(
        X_scaled[0],
        model.predict_proba if hasattr(model, "predict_proba") else model.predict,
        num_features=num_features,
        num_samples=num_samples,
        top_labels=1
    )

    # Get predicted class
    pred_class = int(model.predict(X_scaled)[0])

    # Extract feature contributions
    exp_list = explanation.as_list(label=pred_class)

    features = []
    for feat_desc, weight in exp_list:
        direction = "malware" if weight > 0 else "benign"
        features.append({
            "feature": feat_desc,
            "weight": round(float(weight), 6),
            "direction": direction,
            "abs_weight": round(abs(float(weight)), 6)
        })

    # Sort by absolute weight descending
    features.sort(key=lambda x: x["abs_weight"], reverse=True)

    # Prediction probabilities from LIME
    proba_map = explanation.predict_proba
    benign_prob = round(float(proba_map[0]), 4) if proba_map is not None else 0.0
    malware_prob = round(float(proba_map[1]), 4) if proba_map is not None else 0.0

    return {
        "method": "LIME",
        "predicted_class": "malware" if pred_class == 1 else "benign",
        "benign_probability": benign_prob,
        "malware_probability": malware_prob,
        "features": features,
        "top_malware_features": [f for f in features if f["direction"] == "malware"][:5],
        "top_benign_features": [f for f in features if f["direction"] == "benign"][:5],
        "num_samples": num_samples
    }
