"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from "recharts";

const MODEL_COLORS: Record<string, string> = {
  random_forest: "#00ff9d",
  decision_tree: "#00d4ff",
  knn: "#a855f7",
  svm: "#ff4d6d",
};

const MODEL_LABELS: Record<string, string> = {
  random_forest: "Random Forest",
  decision_tree: "Decision Tree",
  knn: "KNN",
  svm: "SVM",
};

// ── Confusion Matrix ─────────────────────────────────────────────────────────
function ConfusionMatrix({ cm, color }: { cm: { tn: number; fp: number; fn: number; tp: number }; color: string }) {
  const cells = [
    { label: "TN", value: cm.tn, bg: "rgba(0,255,157,0.12)", border: "rgba(0,255,157,0.3)" },
    { label: "FP", value: cm.fp, bg: "rgba(255,77,109,0.12)", border: "rgba(255,77,109,0.3)" },
    { label: "FN", value: cm.fn, bg: "rgba(255,77,109,0.12)", border: "rgba(255,77,109,0.3)" },
    { label: "TP", value: cm.tp, bg: "rgba(0,255,157,0.12)", border: "rgba(0,255,157,0.3)" },
  ];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 6 }}>
        <div style={{ width: 90, textAlign: "center", fontSize: 10, color: "#8899bb" }}>Pred: Benign</div>
        <div style={{ width: 90, textAlign: "center", fontSize: 10, color: "#8899bb" }}>Pred: Malware</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {cells.map((c) => (
          <div
            key={c.label}
            style={{
              padding: "14px 6px",
              borderRadius: 8,
              background: c.bg,
              border: `1px solid ${c.border}`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 10, color: "#8899bb", marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f0f4ff", fontFamily: "var(--font-space)" }}>
              {c.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Metric row ──────────────────────────────────────────────────────────────
function MetricRow({ label, values }: { label: string; values: Record<string, number | string> }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px repeat(4, 1fr)", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", alignItems: "center" }}>
      <div style={{ fontSize: 13, color: "#8899bb" }}>{label}</div>
      {["random_forest", "decision_tree", "knn", "svm"].map((m) => {
        const val = values[m];
        const num = typeof val === "number" ? val : parseFloat(val as string);
        const pct = isNaN(num) ? val : (num > 1 ? `${(num * 100).toFixed(2)}%` : `${(num * 100).toFixed(2)}%`);
        const color = MODEL_COLORS[m];
        return (
          <div key={m} style={{ textAlign: "center", fontWeight: 700, fontSize: 14, color }}>
            {pct}
          </div>
        );
      })}
    </div>
  );
}

export default function ComparePage() {
  const [data, setData] = useState<Record<string, Record<string, unknown>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/compare").then((r) => {
      setData(r.data.models || r.data);
    }).catch(() => {
      // fallback demo
      setData(getDemoData());
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ color: "#00d4ff", fontFamily: "var(--font-space)", fontSize: 18 }}>Loading metrics...</div>
      </div>
    );
  }

  if (!data) return null;

  const models = Object.keys(data);

  // Bar chart data
  const barData = [
    { name: "Accuracy", ...Object.fromEntries(models.map((m) => [MODEL_LABELS[m], Number((data[m] as Record<string, unknown>).accuracy) * 100])) },
    { name: "Precision", ...Object.fromEntries(models.map((m) => [MODEL_LABELS[m], Number((data[m] as Record<string, unknown>).precision) * 100])) },
    { name: "Recall", ...Object.fromEntries(models.map((m) => [MODEL_LABELS[m], Number((data[m] as Record<string, unknown>).recall) * 100])) },
    { name: "F1 Score", ...Object.fromEntries(models.map((m) => [MODEL_LABELS[m], Number((data[m] as Record<string, unknown>).f1_score) * 100])) },
  ];

  // ROC curves
  const rocColors = MODEL_COLORS;

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 24px", position: "relative", zIndex: 1 }}>
      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <span className="badge-benign" style={{ display: "inline-block", marginBottom: 16 }}>
          MODEL COMPARISON
        </span>
        <h1 className="section-title" style={{ marginBottom: 12 }}>
          Performance <span className="gradient-text">Analysis</span>
        </h1>
        <div className="cyber-divider" style={{ marginBottom: 16 }} />
        <p style={{ color: "#8899bb", fontSize: 15 }}>
          Side-by-side comparison of all 4 machine learning models with detailed metrics from the paper.
        </p>
      </div>

      {/* Model header row */}
      <div className="glass-card" style={{ padding: "20px 24px", marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "160px repeat(4, 1fr)", gap: 0 }}>
          <div style={{ fontSize: 11, color: "#5a6a8a", fontWeight: 700 }}>METRIC</div>
          {["random_forest", "decision_tree", "knn", "svm"].map((m) => (
            <div key={m} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: MODEL_COLORS[m] }}>{MODEL_LABELS[m]}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          {[
            { label: "Accuracy", key: "accuracy" },
            { label: "Precision", key: "precision" },
            { label: "Recall", key: "recall" },
            { label: "F1 Score", key: "f1_score" },
            { label: "Specificity", key: "specificity" },
            { label: "FPR (False Positive Rate)", key: "fpr" },
            { label: "FNR (False Negative Rate)", key: "fnr" },
            { label: "NPV", key: "npv" },
            { label: "MCC", key: "mcc" },
            { label: "Balanced Accuracy", key: "balanced_accuracy" },
          ].map(({ label, key }) => (
            <MetricRow
              key={key}
              label={label}
              values={Object.fromEntries(
                ["random_forest", "decision_tree", "knn", "svm"].map((m) => [
                  m,
                  (data[m] as Record<string, unknown>)[key] as number,
                ])
              )}
            />
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        {/* Bar comparison */}
        <div className="glass-card" style={{ padding: 28 }}>
          <h3 style={{ fontFamily: "var(--font-space)", fontSize: 16, fontWeight: 700, marginBottom: 24, color: "#f0f4ff" }}>
            Metric Comparison (%)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: "#8899bb", fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#8899bb", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#0a1628", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 8, color: "#f0f4ff" }}
                formatter={(val: number) => `${val.toFixed(2)}%`}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "#8899bb" }} />
              {Object.keys(MODEL_LABELS).map((m) => (
                <Bar key={m} dataKey={MODEL_LABELS[m]} fill={MODEL_COLORS[m]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ROC Curves */}
        <div className="glass-card" style={{ padding: 28 }}>
          <h3 style={{ fontFamily: "var(--font-space)", fontSize: 16, fontWeight: 700, marginBottom: 24, color: "#f0f4ff" }}>
            ROC Curves
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="x" type="number" domain={[0, 1]} tickCount={5} tick={{ fill: "#8899bb", fontSize: 11 }} label={{ value: "FPR", position: "insideBottom", fill: "#8899bb", fontSize: 11 }} />
              <YAxis domain={[0, 1]} tickCount={5} tick={{ fill: "#8899bb", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 8, color: "#f0f4ff" }} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#8899bb" }} />
              {/* Diagonal (random) */}
              <Line data={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} type="linear" dataKey="y" stroke="#2a3a5a" strokeDasharray="4 4" dot={false} name="Random" />
              {models.map((m) => {
                const roc = (data[m] as Record<string, {fpr: number[], tpr: number[]}>).roc_curve;
                const points = roc.fpr.map((x: number, i: number) => ({ x, y: roc.tpr[i] }));
                return (
                  <Line
                    key={m}
                    data={points}
                    type="monotone"
                    dataKey="y"
                    stroke={rocColors[m]}
                    dot={false}
                    strokeWidth={2}
                    name={`${MODEL_LABELS[m]} (AUC=${((data[m] as Record<string, unknown>).auc as number)?.toFixed(4)})`}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confusion matrices */}
      <div className="glass-card" style={{ padding: 28 }}>
        <h3 style={{ fontFamily: "var(--font-space)", fontSize: 16, fontWeight: 700, marginBottom: 28, color: "#f0f4ff" }}>
          Confusion Matrices
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
          {["random_forest", "decision_tree", "knn", "svm"].map((m) => (
            <div key={m}>
              <div style={{ fontSize: 13, fontWeight: 700, color: MODEL_COLORS[m], marginBottom: 14, textAlign: "center" }}>
                {MODEL_LABELS[m]}
              </div>
              <ConfusionMatrix
                cm={(data[m] as Record<string, {tn: number, fp: number, fn: number, tp: number}>).confusion_matrix}
                color={MODEL_COLORS[m]}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getDemoData() {
  const makeRoc = (auc: number) => {
    const fpr = Array.from({ length: 100 }, (_, i) => i / 99);
    const tpr = fpr.map((f) => Math.min(1, f + auc * (1 - f) * 2));
    return { fpr, tpr };
  };
  return {
    random_forest: { accuracy: 1, precision: 1, recall: 1, f1_score: 1, specificity: 1, fpr: 0, fnr: 0, npv: 1, mcc: 1, balanced_accuracy: 1, auc: 1, roc_curve: makeRoc(1), confusion_matrix: { tn: 9968, fp: 0, fn: 0, tp: 10032 } },
    decision_tree: { accuracy: 0.9999, precision: 1, recall: 0.99, f1_score: 0.99, specificity: 0.9998, fpr: 0.0002, fnr: 0, npv: 1, mcc: 0.9998, balanced_accuracy: 0.9999, auc: 1, roc_curve: makeRoc(0.99), confusion_matrix: { tn: 9966, fp: 2, fn: 0, tp: 10032 } },
    knn: { accuracy: 0.9942, precision: 0.99, recall: 0.99, f1_score: 0.99, specificity: 0.9948, fpr: 0.0052, fnr: 0.0062, npv: 0.9938, mcc: 0.9886, balanced_accuracy: 0.9943, auc: 0.9943, roc_curve: makeRoc(0.97), confusion_matrix: { tn: 9916, fp: 52, fn: 62, tp: 9970 } },
    svm: { accuracy: 0.7585, precision: 0.84, recall: 0.76, f1_score: 0.74, specificity: 0.87, fpr: 0.13, fnr: 0.4829, npv: 0.6772, mcc: 0.5917, balanced_accuracy: 0.7585, auc: 0.7586, roc_curve: makeRoc(0.72), confusion_matrix: { tn: 8700, fp: 1300, fn: 4829, tp: 5171 } },
  };
}
