"use client";
import { useState } from "react";
import axios from "axios";
import {
  Shield, AlertTriangle, CheckCircle, ChevronDown,
  ChevronUp, Upload, Loader2, Zap, FileText
} from "lucide-react";
import Link from "next/link";

// 33 feature fields from the paper's dataset
const FEATURE_FIELDS = [
  { key: "millisecond", label: "Millisecond", placeholder: "0–999", defaultVal: 500 },
  { key: "state", label: "State", placeholder: "0=Unrunnable, 1=Runnable", defaultVal: 1 },
  { key: "usage_counter", label: "Usage Counter", placeholder: "13988–14274", defaultVal: 14000 },
  { key: "prio", label: "Priority", placeholder: "100–140", defaultVal: 120 },
  { key: "static_prio", label: "Static Priority", placeholder: "13988–14274", defaultVal: 14352 },
  { key: "normal_prio", label: "Normal Priority", placeholder: "100–140", defaultVal: 120 },
  { key: "policy", label: "Policy", placeholder: "0 or 1", defaultVal: 0 },
  { key: "vm_pgoff", label: "VM Pgoff", placeholder: "0–100", defaultVal: 0 },
  { key: "vm_truncate_count", label: "VM Truncate Count", placeholder: "0–28", defaultVal: 12648 },
  { key: "task_size", label: "Task Size", placeholder: "10406–16335", defaultVal: 13000 },
  { key: "cached_hole_size", label: "Cached Hole Size", placeholder: "0", defaultVal: 0 },
  { key: "free_area_cache", label: "Free Area Cache", placeholder: "0–30", defaultVal: 5 },
  { key: "mm_users", label: "MM Users", placeholder: "1–5", defaultVal: 1 },
  { key: "map_count", label: "Map Count", placeholder: "10–100", defaultVal: 30 },
  { key: "hiwater_rss", label: "Hiwater RSS", placeholder: "616–724", defaultVal: 670 },
  { key: "total_vm", label: "Total VM", placeholder: "6850–28336", defaultVal: 15000 },
  { key: "shared_vm", label: "Shared VM", placeholder: "0–28", defaultVal: 0 },
  { key: "exec_vm", label: "Exec VM", placeholder: "0–50", defaultVal: 10 },
  { key: "reserved_vm", label: "Reserved VM", placeholder: "0–30", defaultVal: 5 },
  { key: "nr_ptes", label: "Nr PTEs", placeholder: "0–28", defaultVal: 10 },
  { key: "end_data", label: "End Data", placeholder: "616–724", defaultVal: 680 },
  { key: "last_interval", label: "Last Interval", placeholder: "0–1000", defaultVal: 100 },
  { key: "nvcsw", label: "NV Context Switches", placeholder: "0–500", defaultVal: 50 },
  { key: "nivcsw", label: "INV Context Switches", placeholder: "0–500", defaultVal: 45 },
  { key: "min_flt", label: "Minor Faults", placeholder: "0–200", defaultVal: 50 },
  { key: "maj_flt", label: "Major Faults", placeholder: "0–400", defaultVal: 100 },
  { key: "fs_excl_counter", label: "FS Excl Counter", placeholder: "0–10", defaultVal: 0 },
  { key: "lock", label: "Lock", placeholder: "0 or 1", defaultVal: 0 },
  { key: "utime", label: "User Time", placeholder: "0–400000", defaultVal: 200000 },
  { key: "stime", label: "System Time", placeholder: "0–5", defaultVal: 2 },
  { key: "gtime", label: "Guest Time", placeholder: "0–2", defaultVal: 0 },
  { key: "cgtime", label: "CGroup Time", placeholder: "0–10", defaultVal: 0 },
  { key: "signal_nvcsw", label: "Signal NV CSW", placeholder: "337688–355440", defaultVal: 345000 },
];

const MODELS = [
  { value: "random_forest", label: "Random Forest", accuracy: "100%", color: "#00ff9d" },
  { value: "decision_tree", label: "Decision Tree", accuracy: "99.99%", color: "#00d4ff" },
  { value: "knn", label: "K-Nearest Neighbors", accuracy: "99.42%", color: "#a855f7" },
  { value: "svm", label: "Support Vector Machine", accuracy: "75.85%", color: "#ff4d6d" },
];

// Demo values for Malware and Benign
const MALWARE_DEMO = Object.fromEntries(
  FEATURE_FIELDS.map((f) => {
    const malwareOverrides: Record<string, number> = {
      static_prio: 12000, vm_truncate_count: 5000, shared_vm: 0,
      nivcsw: 300, stime: 0, maj_flt: 50, free_area_cache: 10,
    };
    return [f.key, malwareOverrides[f.key] ?? f.defaultVal];
  })
);

const BENIGN_DEMO = Object.fromEntries(
  FEATURE_FIELDS.map((f) => {
    const benignOverrides: Record<string, number> = {
      static_prio: 18000, vm_truncate_count: 25000, shared_vm: 200,
      nivcsw: 10, stime: 3, maj_flt: 250, free_area_cache: 2,
    };
    return [f.key, benignOverrides[f.key] ?? f.defaultVal];
  })
);

export default function AnalyzerPage() {
  const [features, setFeatures] = useState<Record<string, number>>(
    Object.fromEntries(FEATURE_FIELDS.map((f) => [f.key, f.defaultVal]))
  );
  const [selectedModel, setSelectedModel] = useState("random_forest");
  const [showAllFields, setShowAllFields] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    prediction: string;
    confidence: number;
    scan_id: string;
    model_used: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleFields = showAllFields ? FEATURE_FIELDS : FEATURE_FIELDS.slice(0, 12);

  function handleChange(key: string, val: string) {
    setFeatures((prev) => ({ ...prev, [key]: parseFloat(val) || 0 }));
  }

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await axios.post("/api/predict", {
        features,
        model: selectedModel,
      });
      setResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError("Backend not reachable. Run train.py + start FastAPI server. Error: " + message);
      // Simulate result for demo
      const isMalware = features.static_prio < 14352;
      setResult({
        prediction: isMalware ? "malware" : "benign",
        confidence: isMalware ? 0.97 : 0.94,
        scan_id: "demo-" + Date.now(),
        model_used: selectedModel,
      });
    } finally {
      setLoading(false);
    }
  }

  const isMalware = result?.prediction === "malware";

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 24px", position: "relative", zIndex: 1 }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div className="badge-malware" style={{ display: "inline-block", marginBottom: 16 }}>
          THREAT ANALYZER
        </div>
        <h1 className="section-title" style={{ marginBottom: 12 }}>
          Analyze a <span className="gradient-text">Process</span>
        </h1>
        <div className="cyber-divider" style={{ marginBottom: 16 }} />
        <p style={{ color: "#8899bb", fontSize: 15, maxWidth: 600 }}>
          Enter the 33 system-level features of a process to classify it as malware or benign.
          Select your ML model and get an instant prediction with confidence score.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>
        {/* Left: Input form */}
        <div>
          {/* Model selector */}
          <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontFamily: "var(--font-space)", fontSize: 15, fontWeight: 700, marginBottom: 16, color: "#8899bb" }}>
              SELECT ML MODEL
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {MODELS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setSelectedModel(m.value)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: `1px solid ${selectedModel === m.value ? m.color : "rgba(255,255,255,0.08)"}`,
                    background: selectedModel === m.value ? `${m.color}15` : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: selectedModel === m.value ? m.color : "#d0d8f0" }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#8899bb", marginTop: 2 }}>
                    Accuracy: <span style={{ color: m.color }}>{m.accuracy}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick fill */}
          <div className="glass-card" style={{ padding: 20, marginBottom: 20, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "#8899bb", fontWeight: 600 }}>Quick fill:</span>
            <button
              onClick={() => setFeatures(MALWARE_DEMO)}
              style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: "rgba(255,77,109,0.12)", border: "1px solid rgba(255,77,109,0.3)",
                color: "#ff4d6d", cursor: "pointer",
              }}
            >
              ⚠ Load Malware Sample
            </button>
            <button
              onClick={() => setFeatures(BENIGN_DEMO)}
              style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: "rgba(0,255,157,0.08)", border: "1px solid rgba(0,255,157,0.25)",
                color: "#00ff9d", cursor: "pointer",
              }}
            >
              ✓ Load Benign Sample
            </button>
            <button
              onClick={() => setFeatures(Object.fromEntries(FEATURE_FIELDS.map((f) => [f.key, f.defaultVal])))}
              style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#8899bb", cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>

          {/* Feature inputs */}
          <div className="glass-card" style={{ padding: 28 }}>
            <h3 style={{ fontFamily: "var(--font-space)", fontSize: 15, fontWeight: 700, marginBottom: 20, color: "#8899bb" }}>
              PROCESS FEATURES ({FEATURE_FIELDS.length} total)
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
              {visibleFields.map((f) => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8899bb", marginBottom: 5, letterSpacing: "0.5px" }}>
                    {f.label.toUpperCase()}
                  </label>
                  <input
                    type="number"
                    className="cyber-input"
                    placeholder={f.placeholder}
                    value={features[f.key] ?? f.defaultVal}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowAllFields(!showAllFields)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: "none",
                color: "#00d4ff",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                marginTop: 20,
              }}
            >
              {showAllFields ? (
                <><ChevronUp size={16} /> Show fewer fields</>
              ) : (
                <><ChevronDown size={16} /> Show all {FEATURE_FIELDS.length} fields</>
              )}
            </button>
          </div>
        </div>

        {/* Right: Result panel */}
        <div style={{ position: "sticky", top: 84 }}>
          {/* Analyze button */}
          <button
            className="btn-primary"
            onClick={handleAnalyze}
            disabled={loading}
            style={{ width: "100%", fontSize: 16, padding: "16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Analyzing...</> : <><Zap size={18} /> Run Analysis</>}
          </button>

          {error && (
            <div style={{ background: "rgba(255,200,0,0.08)", border: "1px solid rgba(255,200,0,0.2)", borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 12, color: "#ffd700", lineHeight: 1.5 }}>
              ⚠ Demo mode: {error}
            </div>
          )}

          {/* Result card */}
          {result && (
            <div
              className="glass-card"
              style={{
                padding: 28,
                border: `1px solid ${isMalware ? "rgba(255,77,109,0.4)" : "rgba(0,255,157,0.4)"}`,
                boxShadow: isMalware ? "0 0 40px rgba(255,77,109,0.15)" : "0 0 40px rgba(0,255,157,0.1)",
              }}
            >
              {/* Big result */}
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ marginBottom: 16 }}>
                  {isMalware ? (
                    <AlertTriangle size={48} color="#ff4d6d" style={{ margin: "0 auto" }} />
                  ) : (
                    <CheckCircle size={48} color="#00ff9d" style={{ margin: "0 auto" }} />
                  )}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-space)",
                    fontSize: 36,
                    fontWeight: 900,
                    color: isMalware ? "#ff4d6d" : "#00ff9d",
                    textShadow: isMalware ? "0 0 30px rgba(255,77,109,0.5)" : "0 0 30px rgba(0,255,157,0.5)",
                    letterSpacing: "-1px",
                  }}
                >
                  {result.prediction.toUpperCase()}
                </div>
                <div style={{ fontSize: 13, color: "#8899bb", marginTop: 4 }}>
                  Scan ID: <span style={{ fontFamily: "monospace", color: "#d0d8f0" }}>{result.scan_id.slice(0, 8)}...</span>
                </div>
              </div>

              {/* Confidence bar */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: "#8899bb" }}>Confidence</span>
                  <span style={{ fontWeight: 700, color: isMalware ? "#ff4d6d" : "#00ff9d" }}>
                    {(result.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div style={{ height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 5, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${result.confidence * 100}%`,
                      background: isMalware
                        ? "linear-gradient(90deg, #ff4d6d, #ff6b35)"
                        : "linear-gradient(90deg, #00ff9d, #00d4ff)",
                      borderRadius: 5,
                      transition: "width 0.8s ease",
                    }}
                  />
                </div>
              </div>

              {/* Model info */}
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: "#8899bb", marginBottom: 4 }}>MODEL USED</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#d0d8f0" }}>
                  {MODELS.find((m) => m.value === result.model_used)?.label || result.model_used}
                </div>
              </div>

              {/* Links */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link href={`/explainer?scan_id=${result.scan_id}`}>
                  <button className="btn-ghost" style={{ width: "100%", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <FileText size={14} /> View LIME & SHAP Explanation
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* CSV Upload */}
          <div className="glass-card" style={{ padding: 24, marginTop: 16, textAlign: "center" }}>
            <Upload size={24} color="#8899bb" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: "#d0d8f0" }}>Batch Analysis</div>
            <div style={{ fontSize: 12, color: "#8899bb", marginBottom: 16 }}>Upload a CSV file to scan multiple processes at once</div>
            <input
              type="file"
              accept=".csv"
              id="csv-upload"
              style={{ display: "none" }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const formData = new FormData();
                formData.append("file", file);
                try {
                  const { data } = await axios.post(`/api/upload?model=${selectedModel}`, formData);
                  alert(`✅ Batch result: ${data.malware_detected} malware, ${data.benign_detected} benign out of ${data.total_rows} rows.`);
                } catch {
                  alert("Backend not running. Start FastAPI first.");
                }
              }}
            />
            <label htmlFor="csv-upload">
              <span className="btn-ghost" style={{ cursor: "pointer", display: "inline-block", fontSize: 13 }}>
                Choose CSV File
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
