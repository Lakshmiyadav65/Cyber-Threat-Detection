"use client";
import { useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid
} from "recharts";
import { Brain, Zap, AlertTriangle, CheckCircle, Info } from "lucide-react";

const FEATURE_FIELDS = [
  { key: "millisecond", defaultVal: 500 },
  { key: "state", defaultVal: 1 },
  { key: "usage_counter", defaultVal: 14000 },
  { key: "prio", defaultVal: 120 },
  { key: "static_prio", defaultVal: 14352 },
  { key: "normal_prio", defaultVal: 120 },
  { key: "policy", defaultVal: 0 },
  { key: "vm_pgoff", defaultVal: 0 },
  { key: "vm_truncate_count", defaultVal: 12648 },
  { key: "task_size", defaultVal: 13000 },
  { key: "cached_hole_size", defaultVal: 0 },
  { key: "free_area_cache", defaultVal: 5 },
  { key: "mm_users", defaultVal: 1 },
  { key: "map_count", defaultVal: 30 },
  { key: "hiwater_rss", defaultVal: 670 },
  { key: "total_vm", defaultVal: 15000 },
  { key: "shared_vm", defaultVal: 0 },
  { key: "exec_vm", defaultVal: 10 },
  { key: "reserved_vm", defaultVal: 5 },
  { key: "nr_ptes", defaultVal: 10 },
  { key: "end_data", defaultVal: 680 },
  { key: "last_interval", defaultVal: 100 },
  { key: "nvcsw", defaultVal: 50 },
  { key: "nivcsw", defaultVal: 45 },
  { key: "min_flt", defaultVal: 50 },
  { key: "maj_flt", defaultVal: 100 },
  { key: "fs_excl_counter", defaultVal: 0 },
  { key: "lock", defaultVal: 0 },
  { key: "utime", defaultVal: 200000 },
  { key: "stime", defaultVal: 2 },
  { key: "gtime", defaultVal: 0 },
  { key: "cgtime", defaultVal: 0 },
  { key: "signal_nvcsw", defaultVal: 345000 },
];

const MALWARE_FEATURES = Object.fromEntries(
  FEATURE_FIELDS.map((f) => {
    const overrides: Record<string,number> = { static_prio: 12000, vm_truncate_count: 5000, shared_vm: 0, nivcsw: 300, stime: 0, maj_flt: 50, free_area_cache: 10 };
    return [f.key, overrides[f.key] ?? f.defaultVal];
  })
);

const BENIGN_FEATURES = Object.fromEntries(
  FEATURE_FIELDS.map((f) => {
    const overrides: Record<string,number> = { static_prio: 18000, vm_truncate_count: 25000, shared_vm: 200, nivcsw: 10, stime: 3, maj_flt: 250, free_area_cache: 2 };
    return [f.key, overrides[f.key] ?? f.defaultVal];
  })
);

// Chi-squared table from paper
const CHI_SQ_FEATURES = [
  { feature: "static_prio", chi2: 1237.12, p_value: "5.2e-271" },
  { feature: "vm_truncate_count", chi2: 669.57, p_value: "1.2e-147" },
  { feature: "maj_flt", chi2: 422.48, p_value: "7.0e-94" },
  { feature: "hiwater_rss", chi2: 254.55, p_value: "2.6e-57" },
  { feature: "nivcsw", chi2: 240.31, p_value: "3.4e-54" },
  { feature: "total_vm", chi2: 216.63, p_value: "4.9e-49" },
  { feature: "end_data", chi2: 206.47, p_value: "8.1e-47" },
  { feature: "shared_vm", chi2: 187.55, p_value: "1.1e-42" },
  { feature: "millisecond", chi2: 142.71, p_value: "6.8e-33" },
  { feature: "usage_counter", chi2: 131.17, p_value: "2.3e-30" },
];

// Descriptions from paper
const FEATURE_INSIGHTS: Record<string, string> = {
  "static_prio": "Malware often manipulates process priority to gain higher CPU access, enabling it to execute malicious activities without interruption.",
  "vm_truncate_count": "Malware may manipulate virtual memory management to evade detection by security mechanisms.",
  "shared_vm": "Malware exploits shared memory to communicate between processes or inject code into legitimate processes.",
  "nivcsw": "Frequent involuntary context switches indicate suspicious process behavior — malware running covert processes to avoid detection.",
  "millisecond": "Timing-based attacks align with specific system states. Unusual timing correlates with known malicious patterns.",
  "maj_flt": "Lower major page faults indicate more efficient/stealthy memory usage — a characteristic of malware trying to minimize its footprint.",
};

export default function ExplainerPage() {
  const [activeTab, setActiveTab] = useState<"lime" | "shap" | "chi">("lime");
  const [features, setFeatures] = useState(MALWARE_FEATURES);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<{
    lime?: { features: Array<{ feature: string; weight: number; direction: string }>, predicted_class?: string, malware_probability?: number };
    shap?: { features: Array<{ feature: string; shap_value: number; direction: string }>, base_value?: number };
  } | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  async function handleExplain() {
    setLoading(true);
    try {
      const { data } = await axios.post("/api/explain", { features, model: "random_forest" });
      setExplanation(data);
    } catch {
      // Demo mode — simulate explanation from paper
      setExplanation(getDemoExplanation(features));
    } finally {
      setLoading(false);
    }
  }

  const limeFeatures = explanation?.lime?.features?.slice(0, 10) ?? [];
  const shapFeatures = explanation?.shap?.features?.slice(0, 10) ?? [];

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 24px", position: "relative", zIndex: 1 }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <span style={{ display: "inline-block", background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700, color: "#a855f7", letterSpacing: "1px", marginBottom: 16 }}>
          XAI EXPLAINER
        </span>
        <h1 className="section-title" style={{ marginBottom: 12 }}>
          Explainable <span className="gradient-text">AI Insights</span>
        </h1>
        <div className="cyber-divider" style={{ marginBottom: 16 }} />
        <p style={{ color: "#8899bb", fontSize: 15, maxWidth: 600 }}>
          LIME and SHAP reveal which features drove the model&apos;s prediction —
          making the black box transparent and trustworthy.
        </p>
      </div>

      {/* Sample selector + Explain button */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#8899bb" }}>Select sample:</span>
        <button
          onClick={() => setFeatures(MALWARE_FEATURES)}
          style={{
            padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: features === MALWARE_FEATURES ? "rgba(255,77,109,0.15)" : "rgba(255,255,255,0.04)",
            border: features === MALWARE_FEATURES ? "1px solid rgba(255,77,109,0.4)" : "1px solid rgba(255,255,255,0.1)",
            color: features === MALWARE_FEATURES ? "#ff4d6d" : "#8899bb",
            cursor: "pointer",
          }}
        >
          ⚠ Malware Process
        </button>
        <button
          onClick={() => setFeatures(BENIGN_FEATURES)}
          style={{
            padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: features === BENIGN_FEATURES ? "rgba(0,255,157,0.1)" : "rgba(255,255,255,0.04)",
            border: features === BENIGN_FEATURES ? "1px solid rgba(0,255,157,0.3)" : "1px solid rgba(255,255,255,0.1)",
            color: features === BENIGN_FEATURES ? "#00ff9d" : "#8899bb",
            cursor: "pointer",
          }}
        >
          ✓ Benign Process
        </button>
        <button
          className="btn-primary"
          onClick={handleExplain}
          disabled={loading}
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, fontSize: 14, padding: "10px 24px" }}
        >
          {loading ? "Generating..." : <><Brain size={16} /> Generate Explanation</>}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {(["lime", "shap", "chi"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 22px",
              borderRadius: 8,
              border: `1px solid ${activeTab === tab ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.08)"}`,
              background: activeTab === tab ? "rgba(0,212,255,0.1)" : "transparent",
              color: activeTab === tab ? "#00d4ff" : "#8899bb",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.5px",
            }}
          >
            {tab === "lime" ? "LIME Explanation" : tab === "shap" ? "SHAP Force Plot" : "Chi-Squared Validation"}
          </button>
        ))}
      </div>

      {/* ── LIME Tab ── */}
      {activeTab === "lime" && (
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 24 }}>
          <div className="glass-card" style={{ padding: 28 }}>
            <h3 style={{ fontFamily: "var(--font-space)", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              LIME Feature Contributions
            </h3>
            <p style={{ fontSize: 13, color: "#8899bb", marginBottom: 24 }}>
              Orange = pushes toward Malware · Blue = pushes toward Benign
            </p>
            {!explanation && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#8899bb" }}>
                <Brain size={40} color="#a855f7" style={{ margin: "0 auto 16px" }} />
                <p>Click &quot;Generate Explanation&quot; to see LIME feature bars</p>
              </div>
            )}
            {limeFeatures.length > 0 && (
              <div>
                <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 700, color: explanation?.lime?.predicted_class === "malware" ? "#ff4d6d" : "#00ff9d" }}>
                  Predicted: {explanation?.lime?.predicted_class?.toUpperCase()} ({((explanation?.lime?.malware_probability || 0) * 100).toFixed(1)}% malware probability)
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={limeFeatures.map((f) => ({ name: f.feature.split("<=")[0].split(">")[0].trim(), weight: f.weight }))} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis type="number" tick={{ fill: "#8899bb", fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#d0d8f0", fontSize: 11 }} width={140} />
                    <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 8, color: "#f0f4ff" }} formatter={(v: number) => v.toFixed(5)} />
                    <Bar dataKey="weight" radius={[0, 4, 4, 0]} onClick={(d) => setSelectedFeature(d.name)}>
                      {limeFeatures.map((f, i) => (
                        <Cell key={i} fill={f.weight > 0 ? "#ff4d6d" : "#00d4ff"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Feature insight panel */}
          <div className="glass-card" style={{ padding: 28 }}>
            <h3 style={{ fontFamily: "var(--font-space)", fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
              Feature Insights
            </h3>
            {selectedFeature && FEATURE_INSIGHTS[selectedFeature] ? (
              <div style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "#00d4ff", fontWeight: 700, marginBottom: 8 }}>{selectedFeature}</div>
                <p style={{ fontSize: 13, color: "#d0d8f0", lineHeight: 1.6 }}>{FEATURE_INSIGHTS[selectedFeature]}</p>
              </div>
            ) : (
              <div style={{ color: "#8899bb", fontSize: 13, marginBottom: 20 }}>
                <Info size={16} style={{ marginBottom: 8 }} />
                <p>Click a bar in the chart to see domain-specific cybersecurity insight for that feature.</p>
              </div>
            )}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20 }}>
              <div style={{ fontSize: 12, color: "#8899bb", fontWeight: 700, marginBottom: 12, letterSpacing: "0.5px" }}>
                KEY MALWARE INDICATORS (from paper)
              </div>
              {["static_prio", "vm_truncate_count", "shared_vm", "nivcsw", "millisecond"].map((f) => (
                <div key={f} onClick={() => setSelectedFeature(f)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, marginBottom: 4, cursor: "pointer", background: selectedFeature === f ? "rgba(255,77,109,0.1)" : "transparent", border: selectedFeature === f ? "1px solid rgba(255,77,109,0.2)" : "1px solid transparent" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff4d6d", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontFamily: "monospace", color: "#d0d8f0" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SHAP Tab ── */}
      {activeTab === "shap" && (
        <div className="glass-card" style={{ padding: 28 }}>
          <h3 style={{ fontFamily: "var(--font-space)", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
            SHAP Feature Contributions
          </h3>
          <p style={{ fontSize: 13, color: "#8899bb", marginBottom: 24 }}>
            Positive (red) = pushes prediction toward Malware · Negative (blue) = pushes toward Benign
          </p>
          {!explanation ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#8899bb" }}>
              <Zap size={40} color="#a855f7" style={{ margin: "0 auto 16px" }} />
              <p>Click &quot;Generate Explanation&quot; to compute SHAP values</p>
            </div>
          ) : (
            <div>
              {/* Base value bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28, padding: "12px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: "#8899bb" }}>Base value (avg prediction):</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#00d4ff" }}>
                  {explanation.shap?.base_value?.toFixed(4)}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={shapFeatures.map((f) => ({ name: f.feature, value: f.shap_value }))} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" tick={{ fill: "#8899bb", fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#d0d8f0", fontSize: 11, fontFamily: "monospace" }} width={150} />
                  <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 8, color: "#f0f4ff" }} formatter={(v: number) => `SHAP: ${v.toFixed(5)}`} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {shapFeatures.map((f, i) => (
                      <Cell key={i} fill={f.shap_value > 0 ? "#ff4d6d" : "#00d4ff"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── Chi-Squared Tab ── */}
      {activeTab === "chi" && (
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 24 }}>
          <div className="glass-card" style={{ padding: 28 }}>
            <h3 style={{ fontFamily: "var(--font-space)", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              Chi-Squared Statistical Validation
            </h3>
            <p style={{ fontSize: 13, color: "#8899bb", marginBottom: 24 }}>
              Validates LIME & SHAP results. Higher χ² = stronger feature-malware association.
            </p>
            <div>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 140px", padding: "10px 0", borderBottom: "2px solid rgba(0,212,255,0.15)", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#8899bb", letterSpacing: "0.5px" }}>FEATURE</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#8899bb", letterSpacing: "0.5px", textAlign: "right" }}>χ² STATISTIC</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#8899bb", letterSpacing: "0.5px", textAlign: "right" }}>P-VALUE</span>
              </div>
              {CHI_SQ_FEATURES.map((f, i) => (
                <div key={f.feature} style={{ display: "grid", gridTemplateColumns: "1fr 120px 140px", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "#8899bb", fontWeight: 700, width: 20, textAlign: "right" }}>{i + 1}</span>
                    <span style={{ fontSize: 13, fontFamily: "monospace", color: "#d0d8f0" }}>{f.feature}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#ff4d6d" }}>{f.chi2.toLocaleString()}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 12, fontFamily: "monospace", color: "#00ff9d" }}>{f.p_value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: 28 }}>
            <h3 style={{ fontFamily: "var(--font-space)", fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
              Chi-Squared Bar Chart
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={CHI_SQ_FEATURES.map((f) => ({ name: f.feature, chi2: f.chi2 }))} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" tick={{ fill: "#8899bb", fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#d0d8f0", fontSize: 10, fontFamily: "monospace" }} width={130} />
                <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 8, color: "#f0f4ff" }} formatter={(v: number) => `χ² = ${v.toLocaleString()}`} />
                <Bar dataKey="chi2" fill="#a855f7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 20, background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 10, padding: 14 }}>
              <p style={{ fontSize: 12, color: "#d0d8f0", lineHeight: 1.6 }}>
                All P-values are extremely small (&lt; 0.01), providing strong evidence that these features are statistically significant for malware classification.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Demo explanation ─────────────────────────────────────────────────────────
function getDemoExplanation(features: Record<string, number>) {
  const isMalware = features.static_prio < 14352;
  const mult = isMalware ? 1 : -1;
  return {
    lime: {
      predicted_class: isMalware ? "malware" : "benign",
      malware_probability: isMalware ? 0.97 : 0.03,
      features: [
        { feature: "static_prio <= 14352.00", weight: mult * 0.18, direction: isMalware ? "malware" : "benign" },
        { feature: "nivcsw > 45.00", weight: mult * 0.12, direction: isMalware ? "malware" : "benign" },
        { feature: "vm_truncate_count <= 12648.00", weight: mult * 0.10, direction: isMalware ? "malware" : "benign" },
        { feature: "shared_vm <= 114.00", weight: -mult * 0.09, direction: !isMalware ? "malware" : "benign" },
        { feature: "maj_flt <= 114.00", weight: -mult * 0.08, direction: !isMalware ? "malware" : "benign" },
        { feature: "free_area_cache > 4.00", weight: mult * 0.07, direction: isMalware ? "malware" : "benign" },
        { feature: "stime <= 4.00", weight: mult * 0.05, direction: isMalware ? "malware" : "benign" },
        { feature: "end_data <= 114.00", weight: -mult * 0.04, direction: !isMalware ? "malware" : "benign" },
        { feature: "utime <= 378137.00", weight: -mult * 0.03, direction: !isMalware ? "malware" : "benign" },
        { feature: "millisecond <= 500", weight: mult * 0.02, direction: isMalware ? "malware" : "benign" },
      ],
    },
    shap: {
      base_value: 0.5,
      features: [
        { feature: "shared_vm", shap_value: mult * 0.732, direction: isMalware ? "malware" : "benign" },
        { feature: "vm_truncate_count", shap_value: mult * 0.866, direction: isMalware ? "malware" : "benign" },
        { feature: "millisecond", shap_value: mult * 0.708, direction: isMalware ? "malware" : "benign" },
        { feature: "static_prio", shap_value: mult * 0.374, direction: isMalware ? "malware" : "benign" },
        { feature: "nivcsw", shap_value: mult * 0.156, direction: isMalware ? "malware" : "benign" },
        { feature: "end_data", shap_value: mult * 0.598, direction: isMalware ? "malware" : "benign" },
        { feature: "utime", shap_value: mult * 0.058, direction: isMalware ? "malware" : "benign" },
        { feature: "maj_flt", shap_value: -mult * 0.950, direction: !isMalware ? "malware" : "benign" },
        { feature: "fs_excl_counter", shap_value: -mult * 0.950, direction: !isMalware ? "malware" : "benign" },
        { feature: "free_area_cache", shap_value: -mult * 0.156, direction: !isMalware ? "malware" : "benign" },
      ],
    },
  };
}
