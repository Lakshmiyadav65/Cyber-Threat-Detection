"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Clock, AlertTriangle, CheckCircle, Filter, Download, RefreshCw } from "lucide-react";

type ScanRecord = {
  scan_id: string;
  timestamp: string;
  model_used: string;
  prediction: string;
  confidence: number;
  features?: Record<string, number>;
};

type Stats = {
  total_scans: number;
  malware_detected: number;
  benign_detected: number;
  threat_rate: number;
};

const MODEL_LABELS: Record<string, string> = {
  random_forest: "Random Forest",
  decision_tree: "Decision Tree",
  knn: "KNN",
  svm: "SVM",
};

const DEMO_RECORDS: ScanRecord[] = Array.from({ length: 12 }, (_, i) => ({
  scan_id: `demo-${i + 1}-${Math.random().toString(36).slice(2, 8)}`,
  timestamp: new Date(Date.now() - i * 1000 * 60 * 15).toISOString(),
  model_used: ["random_forest", "decision_tree", "knn", "svm"][i % 4],
  prediction: i % 3 === 0 ? "malware" : "benign",
  confidence: 85 + Math.random() * 14,
}));

export default function HistoryPage() {
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [predFilter, setPredFilter] = useState<"all" | "malware" | "benign">("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [isDemo, setIsDemo] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (predFilter !== "all") params.prediction = predFilter;
      if (modelFilter !== "all") params.model = modelFilter;

      const [histRes, statsRes] = await Promise.all([
        axios.get("/api/history", { params }),
        axios.get("/api/history/stats"),
      ]);
      setRecords(histRes.data.results);
      setStats(statsRes.data);
      setIsDemo(false);
    } catch {
      // Demo mode
      let filtered = DEMO_RECORDS;
      if (predFilter !== "all") filtered = filtered.filter((r) => r.prediction === predFilter);
      if (modelFilter !== "all") filtered = filtered.filter((r) => r.model_used === modelFilter);
      setRecords(filtered);
      setStats({
        total_scans: DEMO_RECORDS.length,
        malware_detected: DEMO_RECORDS.filter((r) => r.prediction === "malware").length,
        benign_detected: DEMO_RECORDS.filter((r) => r.prediction === "benign").length,
        threat_rate: (DEMO_RECORDS.filter((r) => r.prediction === "malware").length / DEMO_RECORDS.length) * 100,
      });
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  }, [predFilter, modelFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function downloadCSV() {
    const headers = ["scan_id", "timestamp", "model", "prediction", "confidence"];
    const rows = records.map((r) => [r.scan_id, r.timestamp, r.model_used, r.prediction, r.confidence].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cyberguard_scan_history.csv";
    a.click();
  }

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 24px", position: "relative", zIndex: 1 }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <span style={{ display: "inline-block", background: "rgba(0,255,157,0.1)", border: "1px solid rgba(0,255,157,0.25)", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700, color: "#00ff9d", letterSpacing: "1px", marginBottom: 16 }}>
          SCAN HISTORY
        </span>
        <h1 className="section-title" style={{ marginBottom: 12 }}>
          Analysis <span className="gradient-text">Logs</span>
        </h1>
        <div className="cyber-divider" style={{ marginBottom: 16 }} />
        <p style={{ color: "#8899bb", fontSize: 15 }}>
          All threat analysis results are recorded here for review and audit.
        </p>
      </div>

      {isDemo && (
        <div style={{ background: "rgba(255,200,0,0.06)", border: "1px solid rgba(255,200,0,0.2)", borderRadius: 10, padding: "12px 18px", marginBottom: 24, fontSize: 13, color: "#ffd700" }}>
          ⚠ Demo mode — Start the FastAPI backend to see real scan history.
        </div>
      )}

      {/* Stats row */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Total Scans", value: stats.total_scans, color: "#00d4ff" },
            { label: "Malware Detected", value: stats.malware_detected, color: "#ff4d6d" },
            { label: "Benign Confirmed", value: stats.benign_detected, color: "#00ff9d" },
            { label: "Threat Rate", value: `${stats.threat_rate.toFixed(1)}%`, color: "#a855f7" },
          ].map((s) => (
            <div key={s.label} className="glass-card" style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "var(--font-space)" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#8899bb", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="glass-card" style={{ padding: "16px 20px", marginBottom: 20, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <Filter size={14} color="#8899bb" />
        <span style={{ fontSize: 13, color: "#8899bb", fontWeight: 600 }}>Filter:</span>
        {/* Prediction filter */}
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "malware", "benign"] as const).map((v) => (
            <button key={v} onClick={() => setPredFilter(v)}
              style={{ padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1px solid ${predFilter === v ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.1)"}`, background: predFilter === v ? "rgba(0,212,255,0.1)" : "transparent", color: predFilter === v ? "#00d4ff" : "#8899bb" }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        {/* Model filter */}
        <select
          value={modelFilter}
          onChange={(e) => setModelFilter(e.target.value)}
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, padding: "7px 12px", color: "#d0d8f0", fontSize: 12, cursor: "pointer", outline: "none" }}
        >
          <option value="all">All Models</option>
          <option value="random_forest">Random Forest</option>
          <option value="decision_tree">Decision Tree</option>
          <option value="knn">KNN</option>
          <option value="svm">SVM</option>
        </select>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button onClick={fetchData} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "7px 14px", color: "#8899bb", fontSize: 12, cursor: "pointer" }}>
            <RefreshCw size={12} /> Refresh
          </button>
          <button onClick={downloadCSV} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 6, padding: "7px 14px", color: "#00d4ff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <Download size={12} /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: "hidden" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "180px 120px 160px 130px 130px 1fr", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,212,255,0.04)" }}>
          {["Timestamp", "Model", "Scan ID", "Prediction", "Confidence", ""].map((h) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#8899bb", letterSpacing: "0.5px" }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#8899bb" }}>Loading...</div>
        ) : records.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <Clock size={32} color="#8899bb" style={{ margin: "0 auto 12px" }} />
            <p style={{ color: "#8899bb" }}>No scans yet. Run the Threat Analyzer to see results here.</p>
          </div>
        ) : (
          records.map((r, i) => (
            <div
              key={r.scan_id}
              style={{
                display: "grid",
                gridTemplateColumns: "180px 120px 160px 130px 130px 1fr",
                padding: "15px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                alignItems: "center",
                background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,212,255,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)")}
            >
              <div style={{ fontSize: 12, color: "#8899bb" }}>
                <div>{new Date(r.timestamp).toLocaleDateString()}</div>
                <div style={{ fontSize: 11, color: "#5a6a8a" }}>{new Date(r.timestamp).toLocaleTimeString()}</div>
              </div>
              <div style={{ fontSize: 12, color: "#d0d8f0", fontWeight: 600 }}>
                {MODEL_LABELS[r.model_used] || r.model_used}
              </div>
              <div style={{ fontSize: 11, fontFamily: "monospace", color: "#5a6a8a" }}>
                {r.scan_id.slice(0, 16)}...
              </div>
              <div>
                <span className={r.prediction === "malware" ? "badge-malware" : "badge-benign"}>
                  {r.prediction === "malware" ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertTriangle size={10} /> MALWARE
                    </span>
                  ) : (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle size={10} /> BENIGN
                    </span>
                  )}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: r.prediction === "malware" ? "#ff4d6d" : "#00ff9d" }}>
                {typeof r.confidence === "number" ? `${r.confidence.toFixed(1)}%` : r.confidence}
              </div>
              <div />
            </div>
          ))
        )}
      </div>

      {records.length > 0 && (
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#5a6a8a" }}>
          Showing {records.length} scan{records.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
