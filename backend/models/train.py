"""
CyberGuard AI — ML Training Pipeline
Trains SVM, Decision Tree, KNN, Random Forest on the Kaggle Malware Detection dataset.
Run this script once to generate the .pkl model files and metrics.json.
"""

import os
import json
import joblib
import warnings
import numpy as np
import pandas as pd
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    matthews_corrcoef, confusion_matrix, roc_auc_score,
    balanced_accuracy_score, roc_curve
)

warnings.filterwarnings("ignore")

MODELS_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(MODELS_DIR, "..", "data", "malware_dataset.csv")

# ─── Feature columns (35 features from paper) ──────────────────────────────
FEATURE_COLS = [
    "millisecond", "state", "usage_counter", "prio", "static_prio",
    "normal_prio", "policy", "vm_pgoff", "vm_truncate_count", "task_size",
    "cached_hole_size", "free_area_cache", "mm_users", "map_count",
    "hiwater_rss", "total_vm", "shared_vm", "exec_vm", "reserved_vm",
    "nr_ptes", "end_data", "last_interval", "nvcsw", "nivcsw",
    "min_flt", "maj_flt", "fs_excl_counter", "lock", "utime",
    "stime", "gtime", "cgtime", "signal_nvcsw",
    "vm_truncate_count_2", "map_count_2"   # padded to 35 if needed
]
TARGET_COL = "classification"


def load_and_preprocess(path):
    print(f"[INFO] Loading dataset from: {path}")
    df = pd.read_csv(path)
    print(f"[INFO] Shape: {df.shape}")

    # Drop hash column if present
    if "hash" in df.columns:
        df.drop(columns=["hash"], inplace=True)

    # Encode target
    le = LabelEncoder()
    df[TARGET_COL] = le.fit_transform(df[TARGET_COL])
    label_mapping = dict(zip(le.classes_, le.transform(le.classes_)))
    print(f"[INFO] Label mapping: {label_mapping}")

    # Drop duplicates & handle nulls
    df.drop_duplicates(inplace=True)
    df.dropna(inplace=True)

    # Separate features and target
    feature_cols = [c for c in df.columns if c != TARGET_COL]
    X = df[feature_cols].select_dtypes(include=[np.number])
    y = df[TARGET_COL]

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    X_scaled = pd.DataFrame(X_scaled, columns=X.columns)

    feature_names = list(X.columns)
    print(f"[INFO] Features used ({len(feature_names)}): {feature_names[:5]}...")

    # Save scaler and feature names
    joblib.dump(scaler, os.path.join(MODELS_DIR, "scaler.pkl"))
    with open(os.path.join(MODELS_DIR, "feature_names.json"), "w") as f:
        json.dump(feature_names, f)

    return X_scaled, y, feature_names, label_mapping


def compute_metrics(model, X_test, y_test, model_name):
    y_pred = model.predict(X_test)

    # ROC AUC
    try:
        if hasattr(model, "predict_proba"):
            y_prob = model.predict_proba(X_test)[:, 1]
        else:
            y_prob = model.decision_function(X_test)
        auc = round(roc_auc_score(y_test, y_prob), 4)
        fpr_curve, tpr_curve, _ = roc_curve(y_test, y_prob)
        roc_data = {
            "fpr": fpr_curve.tolist()[:200],
            "tpr": tpr_curve.tolist()[:200]
        }
    except Exception:
        auc = None
        roc_data = {"fpr": [], "tpr": []}

    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()

    precision = round(precision_score(y_test, y_pred, zero_division=0), 4)
    recall = round(recall_score(y_test, y_pred, zero_division=0), 4)
    f1 = round(f1_score(y_test, y_pred, zero_division=0), 4)
    accuracy = round(accuracy_score(y_test, y_pred), 4)
    mcc = round(matthews_corrcoef(y_test, y_pred), 4)
    specificity = round(tn / (tn + fp) if (tn + fp) > 0 else 0, 4)
    fpr_val = round(fp / (fp + tn) if (fp + tn) > 0 else 0, 4)
    fnr = round(fn / (fn + tp) if (fn + tp) > 0 else 0, 4)
    npv = round(tn / (tn + fn) if (tn + fn) > 0 else 0, 4)
    balanced_acc = round(balanced_accuracy_score(y_test, y_pred), 4)

    metrics = {
        "model": model_name,
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "specificity": specificity,
        "fpr": fpr_val,
        "fnr": fnr,
        "npv": npv,
        "mcc": mcc,
        "balanced_accuracy": balanced_acc,
        "auc": auc,
        "roc_curve": roc_data,
        "confusion_matrix": {
            "tn": int(tn), "fp": int(fp),
            "fn": int(fn), "tp": int(tp)
        }
    }
    print(f"  ✅ {model_name}: Acc={accuracy*100:.2f}%, F1={f1*100:.2f}%, AUC={auc}")
    return metrics


def train_all_models(X_train, X_test, y_train, y_test, feature_names):
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    models_config = {
        "random_forest": RandomForestClassifier(
            n_estimators=400,
            max_features="sqrt",
            min_samples_split=10,
            min_samples_leaf=1,
            criterion="gini",
            random_state=42,
            n_jobs=-1
        ),
        "decision_tree": DecisionTreeClassifier(
            max_depth=20,
            min_samples_split=5,
            min_samples_leaf=2,
            criterion="gini",
            random_state=42
        ),
        "knn": KNeighborsClassifier(
            n_neighbors=5,
            metric="euclidean",
            n_jobs=-1
        ),
        "svm": SVC(
            C=10,
            kernel="rbf",
            gamma=1e-4,
            probability=True,
            random_state=42
        )
    }

    all_metrics = {}

    for name, model in models_config.items():
        print(f"\n[TRAINING] {name.upper()}...")

        # 5-fold cross-validation score
        cv_scores = cross_val_score(model, X_train, y_train, cv=skf, scoring="accuracy", n_jobs=-1)
        print(f"  CV Accuracy: {cv_scores.mean()*100:.2f}% ± {cv_scores.std()*100:.2f}%")

        # Train on full training set
        model.fit(X_train, y_train)

        # Save model
        model_path = os.path.join(MODELS_DIR, f"{name}_model.pkl")
        joblib.dump(model, model_path)
        print(f"  Saved → {model_path}")

        # Compute metrics
        metrics = compute_metrics(model, X_test, y_test, name)
        metrics["cv_accuracy_mean"] = round(float(cv_scores.mean()), 4)
        metrics["cv_accuracy_std"] = round(float(cv_scores.std()), 4)
        all_metrics[name] = metrics

        # Feature importance (RF and DT only)
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            feat_imp = sorted(
                zip(feature_names, importances.tolist()),
                key=lambda x: x[1], reverse=True
            )
            metrics["feature_importance"] = feat_imp[:15]

    return all_metrics


def main():
    os.makedirs(os.path.join(MODELS_DIR, "..", "data"), exist_ok=True)

    if not os.path.exists(DATA_PATH):
        print("\n⚠️  Dataset not found!")
        print(f"   Please download the Kaggle dataset and place it at:")
        print(f"   {DATA_PATH}")
        print("\n   Dataset URL: https://www.kaggle.com/datasets/nsaravana/malware-detection")
        print("\n   Generating synthetic dataset for demo purposes...")
        generate_synthetic_dataset(DATA_PATH)

    X, y, feature_names, label_mapping = load_and_preprocess(DATA_PATH)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\n[INFO] Train: {X_train.shape}, Test: {X_test.shape}")

    all_metrics = train_all_models(X_train, X_test, y_train, y_test, feature_names)

    # Save metrics to JSON
    metrics_path = os.path.join(MODELS_DIR, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(all_metrics, f, indent=2)
    print(f"\n[DONE] All metrics saved → {metrics_path}")
    print("\n🎉 Training complete! All models saved.")


def generate_synthetic_dataset(path):
    """Generates a realistic synthetic malware dataset for demo/dev."""
    np.random.seed(42)
    n = 10000  # 10K rows for demo (Kaggle has 100K)

    malware_data = {
        "millisecond": np.random.randint(0, 1000, n // 2),
        "state": np.random.choice([0, 1], n // 2),
        "usage_counter": np.random.randint(13988, 14274, n // 2),
        "prio": np.random.randint(100, 140, n // 2),
        "static_prio": np.random.randint(10000, 14500, n // 2),
        "normal_prio": np.random.randint(100, 140, n // 2),
        "policy": np.random.choice([0, 1], n // 2),
        "vm_pgoff": np.random.randint(0, 100, n // 2),
        "vm_truncate_count": np.random.randint(0, 15000, n // 2),
        "task_size": np.random.randint(10406, 16335, n // 2),
        "cached_hole_size": np.random.randint(0, 100, n // 2),
        "free_area_cache": np.random.randint(4, 30, n // 2),
        "mm_users": np.random.randint(1, 5, n // 2),
        "map_count": np.random.randint(10, 100, n // 2),
        "hiwater_rss": np.random.randint(616, 724, n // 2),
        "total_vm": np.random.randint(6850, 28336, n // 2),
        "shared_vm": np.random.randint(0, 120, n // 2),
        "exec_vm": np.random.randint(0, 50, n // 2),
        "reserved_vm": np.random.randint(0, 30, n // 2),
        "nr_ptes": np.random.randint(0, 28, n // 2),
        "end_data": np.random.randint(616, 724, n // 2),
        "last_interval": np.random.randint(0, 1000, n // 2),
        "nvcsw": np.random.randint(0, 500, n // 2),
        "nivcsw": np.random.randint(45, 500, n // 2),
        "min_flt": np.random.randint(0, 200, n // 2),
        "maj_flt": np.random.randint(0, 115, n // 2),
        "fs_excl_counter": np.random.randint(0, 10, n // 2),
        "lock": np.random.randint(0, 2, n // 2),
        "utime": np.random.randint(0, 400000, n // 2),
        "stime": np.random.randint(0, 5, n // 2),
        "gtime": np.random.randint(0, 2, n // 2),
        "cgtime": np.random.randint(0, 10, n // 2),
        "signal_nvcsw": np.random.randint(337688, 355440, n // 2),
        "classification": ["malware"] * (n // 2)
    }

    benign_data = {
        "millisecond": np.random.randint(0, 1000, n // 2),
        "state": np.random.choice([0, 1], n // 2),
        "usage_counter": np.random.randint(13988, 14274, n // 2),
        "prio": np.random.randint(100, 140, n // 2),
        "static_prio": np.random.randint(14352, 20000, n // 2),
        "normal_prio": np.random.randint(100, 140, n // 2),
        "policy": np.random.choice([0, 1], n // 2),
        "vm_pgoff": np.random.randint(0, 100, n // 2),
        "vm_truncate_count": np.random.randint(15000, 30000, n // 2),
        "task_size": np.random.randint(10406, 16335, n // 2),
        "cached_hole_size": np.random.randint(0, 100, n // 2),
        "free_area_cache": np.random.randint(0, 5, n // 2),
        "mm_users": np.random.randint(1, 5, n // 2),
        "map_count": np.random.randint(10, 100, n // 2),
        "hiwater_rss": np.random.randint(616, 724, n // 2),
        "total_vm": np.random.randint(6850, 28336, n // 2),
        "shared_vm": np.random.randint(114, 300, n // 2),
        "exec_vm": np.random.randint(0, 50, n // 2),
        "reserved_vm": np.random.randint(0, 30, n // 2),
        "nr_ptes": np.random.randint(0, 28, n // 2),
        "end_data": np.random.randint(616, 724, n // 2),
        "last_interval": np.random.randint(0, 1000, n // 2),
        "nvcsw": np.random.randint(0, 500, n // 2),
        "nivcsw": np.random.randint(0, 46, n // 2),
        "min_flt": np.random.randint(0, 200, n // 2),
        "maj_flt": np.random.randint(114, 400, n // 2),
        "fs_excl_counter": np.random.randint(0, 10, n // 2),
        "lock": np.random.randint(0, 2, n // 2),
        "utime": np.random.randint(0, 400000, n // 2),
        "stime": np.random.randint(0, 5, n // 2),
        "gtime": np.random.randint(0, 2, n // 2),
        "cgtime": np.random.randint(0, 10, n // 2),
        "signal_nvcsw": np.random.randint(337688, 355440, n // 2),
        "classification": ["benign"] * (n // 2)
    }

    df_mal = pd.DataFrame(malware_data)
    df_ben = pd.DataFrame(benign_data)
    df = pd.concat([df_mal, df_ben], ignore_index=True).sample(frac=1, random_state=42)
    df.to_csv(path, index=False)
    print(f"  [INFO] Synthetic dataset generated: {path} ({len(df)} rows)")


if __name__ == "__main__":
    main()
