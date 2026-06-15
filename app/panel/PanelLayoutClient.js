"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const ADMIN_NAV = [
  {
    label: "Gracze",
    href: "/panel/gracze",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
      </svg>
    ),
  },
  {
    label: "Aktualności",
    href: "/panel/aktualnosci",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
        <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z" />
      </svg>
    ),
  },
  {
    label: "Sezony",
    href: "/panel/sezony",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    label: "Transmisja",
    href: "/panel/transmisja",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Profil",
    href: "/panel/profil",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20v-1a8 8 0 0 1 16 0v1" />
      </svg>
    ),
  },
];

const PLAYER_NAV = [
  {
    label: "Profil",
    href: "/panel/profil",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20v-1a8 8 0 0 1 16 0v1" />
      </svg>
    ),
  },
  {
    label: "Statystyki",
    href: "/panel/statystyki",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
];

export default function PanelLayoutClient({ role, login, name, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navItems = role === "ADMIN" ? ADMIN_NAV : PLAYER_NAV;
  const displayName = name || login;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#030712", display: "flex" }}>
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        />
      )}

      <aside className="panel-sidebar" style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 220,
        background: "rgba(255,255,255,0.02)", borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column", zIndex: 50, transition: "transform 0.25s",
      }}>
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="MKS Drawa" width={36} height={36} style={{ objectFit: "contain", borderRadius: 4 }} />
          <div>
            <div style={{ fontSize: 13, fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff", lineHeight: 1 }}>
              MKS Drawa
            </div>
            <div style={{ fontSize: 9, color: role === "ADMIN" ? "#3b82f6" : "#22c55e", letterSpacing: "0.2em" }}>
              {role === "ADMIN" ? "ADMIN" : role === "STAFF" ? "SZTAB" : "PIŁKARZ"}
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                  borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 500,
                  color: active ? "#fff" : "#64748b",
                  background: active ? "rgba(59,130,246,0.12)" : "transparent",
                  border: active ? "1px solid rgba(59,130,246,0.2)" : "1px solid transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#94a3b8"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "#64748b"; }}
              >
                <span style={{ color: active ? "#3b82f6" : "inherit", opacity: active ? 1 : 0.6 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: 11, color: "#475569", marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/" style={{ fontSize: 11, color: "#334155", textDecoration: "none", flex: 1 }}>← Strona</Link>
            <button onClick={handleLogout} style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#475569", fontSize: 11, padding: "5px 10px", cursor: "pointer" }}>
              Wyloguj
            </button>
          </div>
        </div>
      </aside>

      <div className="panel-main" style={{ flex: 1, marginLeft: 220, display: "flex", flexDirection: "column" }}>
        <div className="panel-topbar" style={{ height: 52, borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="panel-hamburger"
            onClick={() => setSidebarOpen((o) => !o)}
            style={{ display: "none", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#94a3b8", fontSize: 16, padding: "4px 8px", cursor: "pointer" }}
          >
            ☰
          </button>
          <div style={{ fontSize: 12, color: "#334155" }}>
            {navItems.find((i) => pathname.startsWith(i.href))?.label ?? (role === "ADMIN" ? "Dashboard" : "Panel")}
          </div>
        </div>
        <div style={{ flex: 1, padding: "28px 28px" }}>{children}</div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #030712; color: #fff; font-family: -apple-system,'Segoe UI',sans-serif; }
        input::placeholder { color: #334155; }
        input:focus { outline: none; border-color: rgba(59,130,246,0.5) !important; }
        @media (max-width: 640px) {
          .panel-sidebar { transform: translateX(-100%) !important; }
          .panel-main { margin-left: 0 !important; }
          .panel-hamburger { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
