"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SECTIONS = [
  {
    href: "/admin/gracze",
    label: "Gracze",
    desc: "Konta piłkarzy, edycja, reset hasła",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
      </svg>
    ),
    color: "#22c55e",
    colorBg: "rgba(34,197,94,0.08)",
    colorBorder: "rgba(34,197,94,0.2)",
  },
  {
    href: "/admin/transmisja",
    label: "Transmisja",
    desc: "Zarządzaj transmisją na żywo YouTube",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
      </svg>
    ),
    color: "#ef4444",
    colorBg: "rgba(239,68,68,0.08)",
    colorBorder: "rgba(239,68,68,0.2)",
  },
];

export default function AdminDashboard() {
  const [streamActive, setStreamActive] = useState(false);

  useEffect(() => {
    fetch("/api/stream/url")
      .then((r) => r.json())
      .then((d) => setStreamActive(!!d.url))
      .catch(() => {});
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: "clamp(22px,4vw,30px)",
          fontFamily: "'Bebas Neue', Impact, sans-serif",
          letterSpacing: "0.1em", color: "#fff",
        }}>
          Dashboard
        </div>
        <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
          Panel administracyjny MKS Drawa Drawno
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} style={{ textDecoration: "none" }}>
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12, padding: "20px 20px",
              cursor: "pointer", transition: "border-color 0.2s, background 0.2s",
              display: "flex", flexDirection: "column", gap: 12,
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = s.colorBorder;
                e.currentTarget.style.background = s.colorBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: s.colorBg, border: `1px solid ${s.colorBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: s.color,
              }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                  {s.label}
                  {s.href === "/admin/transmisja" && streamActive && (
                    <span style={{
                      fontSize: 10, color: "#ef4444", fontWeight: 700,
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      borderRadius: 20, padding: "2px 7px",
                    }}>
                      LIVE
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 3 }}>{s.desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
