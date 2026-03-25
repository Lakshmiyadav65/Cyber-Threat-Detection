"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Search, BarChart3, Brain, History, Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/analyzer", label: "Threat Analyzer", icon: Search },
  { href: "/explainer", label: "XAI Explainer", icon: Brain },
  { href: "/compare", label: "Model Compare", icon: BarChart3 },
  { href: "/history", label: "Scan History", icon: History },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(5, 11, 24, 0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0, 212, 255, 0.12)",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "linear-gradient(135deg, #00d4ff, #a855f7)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shield size={20} color="#050b18" />
          </div>
          <span
            style={{
              fontFamily: "var(--font-space)",
              fontWeight: 800,
              fontSize: 18,
              background: "linear-gradient(135deg, #00d4ff, #a855f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            CyberGuard AI
          </span>
        </Link>

        {/* Desktop Links */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }} className="hidden md:flex">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#00d4ff" : "#8899bb",
                  background: active ? "rgba(0, 212, 255, 0.1)" : "transparent",
                  border: active ? "1px solid rgba(0, 212, 255, 0.2)" : "1px solid transparent",
                  transition: "all 0.2s ease",
                }}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Live status badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(0, 255, 157, 0.08)",
            border: "1px solid rgba(0, 255, 157, 0.2)",
            borderRadius: 20,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 700,
            color: "#00ff9d",
            letterSpacing: "0.5px",
          }}
          className="hidden md:flex"
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#00ff9d",
              display: "inline-block",
              animation: "pulse-cyan 2s infinite",
            }}
          />
          SYSTEM ACTIVE
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden"
          style={{
            background: "transparent",
            border: "none",
            color: "#00d4ff",
            cursor: "pointer",
          }}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          style={{
            borderTop: "1px solid rgba(0, 212, 255, 0.1)",
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
          className="md:hidden"
        >
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 16px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 15,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#00d4ff" : "#8899bb",
                  background: active ? "rgba(0, 212, 255, 0.1)" : "transparent",
                }}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
