"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Shield, Search, Brain, BarChart3, TrendingUp,
  AlertTriangle, CheckCircle, Zap, ArrowRight, Activity
} from "lucide-react";

// ─── Animated counter ───────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, color, suffix, prefix, sublabel
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  suffix?: string;
  prefix?: string;
  sublabel?: string;
}) {
  return (
    <div className="glass-card" style={{ padding: 24, position: "relative", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: `${color}15`,
          filter: "blur(30px)",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `${color}18`,
            border: `1px solid ${color}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={22} color={color} />
        </div>
        <TrendingUp size={14} color="#8899bb" />
      </div>
      <div style={{ fontFamily: "var(--font-space)", fontSize: 32, fontWeight: 800, color }}>
        <AnimatedCounter target={value} suffix={suffix} prefix={prefix} />
      </div>
      <div style={{ fontSize: 13, color: "#8899bb", marginTop: 4 }}>{label}</div>
      {sublabel && (
        <div style={{ fontSize: 11, color: "#5a6a8a", marginTop: 2 }}>{sublabel}</div>
      )}
    </div>
  );
}

// ─── Feature Card ──────────────────────────────────────────────────────────
function FeatureCard({
  icon: Icon, title, desc, href, color
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  href: string;
  color: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        className="glass-card"
        style={{
          padding: 28,
          cursor: "pointer",
          transition: "all 0.3s ease",
          height: "100%",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = `${color}50`;
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 16px 40px ${color}20`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0, 212, 255, 0.15)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: `${color}18`,
            border: `1px solid ${color}35`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <Icon size={26} color={color} />
        </div>
        <h3
          style={{
            fontFamily: "var(--font-space)",
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 10,
            color: "#f0f4ff",
          }}
        >
          {title}
        </h3>
        <p style={{ fontSize: 14, color: "#8899bb", lineHeight: 1.6 }}>{desc}</p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 20,
            color,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Explore <ArrowRight size={14} />
        </div>
      </div>
    </Link>
  );
}

// ─── Model Accuracy Bar ──────────────────────────────────────────────────────
function ModelBar({ name, accuracy, color }: { name: string; accuracy: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(accuracy), 300);
    return () => clearTimeout(t);
  }, [accuracy]);

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
        <span style={{ color: "#d0d8f0", fontWeight: 600 }}>{name}</span>
        <span style={{ color, fontWeight: 700 }}>{accuracy}%</span>
      </div>
      <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${width}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            borderRadius: 4,
            transition: "width 1.2s ease",
          }}
        />
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* ── Hero Section ── */}
      <section
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "80px 24px 60px",
          textAlign: "center",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(0, 212, 255, 0.1)",
            border: "1px solid rgba(0, 212, 255, 0.25)",
            borderRadius: 20,
            padding: "6px 18px",
            fontSize: 12,
            fontWeight: 700,
            color: "#00d4ff",
            letterSpacing: "1px",
            marginBottom: 28,
          }}
        >
          <Zap size={12} />
          ML-BASED CYBER THREAT DETECTION
        </div>

        {/* Heading */}
        <h1
          className="section-title"
          style={{ fontSize: "clamp(36px, 5vw, 64px)", marginBottom: 20, letterSpacing: "-2px" }}
        >
          Detect Threats.
          <br />
          <span className="gradient-text">Understand Why.</span>
        </h1>

        <p
          style={{
            fontSize: "clamp(15px, 2vw, 18px)",
            color: "#8899bb",
            maxWidth: 600,
            margin: "0 auto 40px",
            lineHeight: 1.7,
          }}
        >
          Powered by Random Forest, SVM, KNN & Decision Tree models with
          LIME and SHAP Explainable AI — so you don&apos;t just detect malware, you
          understand it.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/analyzer">
            <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
              <Search size={18} /> Analyze a Threat
            </button>
          </Link>
          <Link href="/compare">
            <button className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
              <BarChart3 size={18} /> Compare Models
            </button>
          </Link>
        </div>

        {/* Floating shield icon */}
        <div style={{ marginTop: 60 }} className="animate-float">
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(168,85,247,0.1))",
              border: "2px solid rgba(0,212,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              boxShadow: "0 0 60px rgba(0,212,255,0.15)",
            }}
          >
            <Shield size={52} color="#00d4ff" />
          </div>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px 60px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          <StatCard icon={Shield} label="Training Samples" value={100000} color="#00d4ff" />
          <StatCard icon={CheckCircle} label="Best Model Accuracy" value={100} suffix="%" color="#00ff9d" sublabel="Random Forest" />
          <StatCard icon={AlertTriangle} label="Malware Types Detected" value={9} color="#ff4d6d" sublabel="Ransomware, Trojans, etc." />
          <StatCard icon={Activity} label="ML Models Compared" value={4} color="#a855f7" sublabel="RF, SVM, DT, KNN" />
        </div>
      </section>

      {/* ── Features Section ── */}
      <section
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 24px 60px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 className="section-title" style={{ marginBottom: 12 }}>
            Platform <span className="gradient-text">Features</span>
          </h2>
          <div className="cyber-divider" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "#8899bb", fontSize: 15 }}>
            Everything you need to detect and understand cyber threats
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          <FeatureCard
            icon={Search}
            title="Threat Analyzer"
            desc="Input 35 system-level features or upload a CSV to detect malware in real-time. Choose your ML model and get instant results."
            href="/analyzer"
            color="#00d4ff"
          />
          <FeatureCard
            icon={Brain}
            title="XAI Explainer"
            desc="Understand why a prediction was made. LIME feature bars and SHAP force plots reveal exactly which features drove the decision."
            href="/explainer"
            color="#a855f7"
          />
          <FeatureCard
            icon={BarChart3}
            title="Model Comparison"
            desc="Compare SVM, Decision Tree, KNN, and Random Forest side-by-side. ROC curves, confusion matrices, and full metric tables."
            href="/compare"
            color="#ff4d6d"
          />
          <FeatureCard
            icon={Activity}
            title="Scan History"
            desc="Full log of every scan performed. Filter by model, prediction type, and date. Export results as CSV."
            href="/history"
            color="#00ff9d"
          />
        </div>
      </section>

      {/* ── Model Performance Preview ── */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="md:grid-cols-2">
          {/* Accuracy bars */}
          <div className="glass-card" style={{ padding: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
              <BarChart3 size={20} color="#00d4ff" />
              <h3
                style={{
                  fontFamily: "var(--font-space)",
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                Model Accuracy
              </h3>
            </div>
            <ModelBar name="Random Forest" accuracy={100} color="#00ff9d" />
            <ModelBar name="Decision Tree" accuracy={99.99} color="#00d4ff" />
            <ModelBar name="K-Nearest Neighbors" accuracy={99.42} color="#a855f7" />
            <ModelBar name="Support Vector Machine" accuracy={75.85} color="#ff4d6d" />
            <Link href="/compare">
              <button className="btn-ghost" style={{ marginTop: 20, width: "100%", fontSize: 13 }}>
                View Full Comparison →
              </button>
            </Link>
          </div>

          {/* Top Features */}
          <div className="glass-card" style={{ padding: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
              <Brain size={20} color="#a855f7" />
              <h3
                style={{
                  fontFamily: "var(--font-space)",
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                Top Malware Indicators
              </h3>
            </div>
            {[
              { name: "static_prio", chi2: 1237.12, color: "#ff4d6d" },
              { name: "vm_truncate_count", chi2: 669.57, color: "#ff6b35" },
              { name: "maj_flt", chi2: 422.48, color: "#ff9f0a" },
              { name: "hiwater_rss", chi2: 254.55, color: "#a855f7" },
              { name: "nivcsw", chi2: 240.31, color: "#00d4ff" },
              { name: "shared_vm", chi2: 187.55, color: "#00ff9d" },
            ].map((f) => (
              <div
                key={f.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: f.color,
                      boxShadow: `0 0 6px ${f.color}`,
                    }}
                  />
                  <span style={{ fontSize: 13, fontFamily: "monospace", color: "#d0d8f0" }}>
                    {f.name}
                  </span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: f.color }}>
                  χ² = {f.chi2.toLocaleString()}
                </span>
              </div>
            ))}
            <Link href="/explainer">
              <button className="btn-ghost" style={{ marginTop: 20, width: "100%", fontSize: 13 }}>
                Explore XAI Explanations →
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
