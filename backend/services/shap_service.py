"""
SHAP Explanation Service
Generates Shapley Additive Explanations for individual predictions.
"""

import numpy as np
import shap
from typing import List, Dict, Any

_shap_cache = {}


def get_shap_explanation(
    model,
    X_scaled: np.ndarray,
    feature_names: List[str],
    num_background: int = 100
) -> Dict[str, Any]:
    """
    Returns SHAP values as structured JSON for the frontend force plot.
    """
    model_key = id(model)

    # Build explainer (cached)
    if model_key not in _shap_cache:
        background = shap.maskers.Independent(
            np.random.randn(num_background, X_scaled.shape[1]),
            max_samples=num_background
        )
        try:
            if hasattr(model, "estimators_"):  # Tree-based (RF, DT)
                explainer = shap.TreeExplainer(model)
            else:
                explainer = shap.KernelExplainer(
                    model.predict_proba if hasattr(model, "predict_proba") else model.predict,
                    np.zeros((1, X_scaled.shape[1]))
                )
        except Exception:
            explainer = shap.KernelExplainer(
                model.predict_proba if hasattr(model, "predict_proba") else model.predict,
                np.zeros((1, X_scaled.shape[1]))
            )
        _shap_cache[model_key] = explainer

    explainer = _shap_cache[model_key]

    # Compute SHAP values
    try:
        shap_values = explainer.shap_values(X_scaled)
    except Exception as e:
        return {"error": f"SHAP computation failed: {str(e)}"}

    # Handle multi-class output (index 1 = malware class)
    if isinstance(shap_values, list):
        vals = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
    else:
        vals = shap_values[0]

    # Base value
    try:
        if isinstance(explainer.expected_value, (list, np.ndarray)):
            base_value = float(explainer.expected_value[1])
        else:
            base_value = float(explainer.expected_value)
    except Exception:
        base_value = 0.5

    # Build feature contributions
    features = []
    for i, (name, val) in enumerate(zip(feature_names, vals)):
        features.append({
            "feature": name,
            "shap_value": round(float(val), 6),
            "feature_value": round(float(X_scaled[0][i]), 6),
            "direction": "malware" if val > 0 else "benign",
            "abs_shap": round(abs(float(val)), 6)
        })

    features.sort(key=lambda x: x["abs_shap"], reverse=True)

    return {
        "method": "SHAP",
        "base_value": round(base_value, 4),
        "prediction_value": round(base_value + sum(f["shap_value"] for f in features), 4),
        "features": features[:15],
        "top_positive": [f for f in features if f["direction"] == "malware"][:5],
        "top_negative": [f for f in features if f["direction"] == "benign"][:5],
        "key_features_chi_squared": [
            {"feature": "static_prio", "chi2": 1237.12, "p_value": "5.2e-271"},
            {"feature": "vm_truncate_count", "chi2": 669.57, "p_value": "1.2e-147"},
            {"feature": "maj_flt", "chi2": 422.48, "p_value": "7.0e-94"},
            {"feature": "hiwater_rss", "chi2": 254.55, "p_value": "2.6e-57"},
            {"feature": "nivcsw", "chi2": 240.31, "p_value": "3.4e-54"},
            {"feature": "total_vm", "chi2": 216.63, "p_value": "4.9e-49"},
            {"feature": "end_data", "chi2": 206.47, "p_value": "8.1e-47"},
            {"feature": "shared_vm", "chi2": 187.55, "p_value": "1.1e-42"},
            {"feature": "millisecond", "chi2": 142.71, "p_value": "6.8e-33"},
            {"feature": "usage_counter", "chi2": 131.17, "p_value": "2.3e-30"}
        ]
    }
