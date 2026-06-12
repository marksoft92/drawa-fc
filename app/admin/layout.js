"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const NAV_ITEMS = [
  {
    label: "Gracze",
    href: "/admin/gracze",
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
    label: "Transmisja",
    href: "/admin/transmisja",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

function LoginScreen({ onLogin }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/stream/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      if (r.ok) {
        onLogin();
      } else {
        const d = await r.json();
        setError(d.error || "Nieprawidłowe dane logowania");
      }
    } catch {
      setError("Błąd połączenia z serwerem");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#030712",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        width: "100%", maxWidth: 380,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14, padding: "32px 28px",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="MKS Drawa" width={56} height={56}
            style={{ objectFit: "contain", borderRadius: 4, marginBottom: 14 }} />
          <div style={{
            fontSize: 22, fontFamily: "'Bebas Neue', Impact, sans-serif",
            letterSpacing: "0.1em", color: "#fff",
          }}>
            Panel Administracyjny
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>MKS Drawa Drawno</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Login</label>
            <input
              type="text" value={login} onChange={(e) => setLogin(e.target.value)}
              style={inputStyle} autoComplete="username" required
            />
          </div>
          <div>
            <label style={labelStyle}>Hasło</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              style={inputStyle} autoComplete="current-password" required
            />
          </div>

          {error && (
            <div style={{
              fontSize: 13, color: "#ef4444",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 7, padding: "9px 13px",
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={btnPrimaryStyle}>
            {loading ? "Logowanie..." : "Zaloguj się"}
          </button>
        </form>

        <div style={{
          marginTop: 20, padding: "12px 14px",
          background: "rgba(59,130,246,0.05)",
          border: "1px solid rgba(59,130,246,0.15)",
          borderRadius: 8, fontSize: 12, color: "#475569", lineHeight: 1.6,
        }}>
          Jesteś piłkarzem?{" "}
          <Link href="/login" style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 600 }}>
            Zaloguj się tutaj →
          </Link>
          <br />
          Ten panel jest tylko dla administratorów klubu.
        </div>
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <Link href="/" style={{ fontSize: 12, color: "#334155", textDecoration: "none" }}>
            ← Strona główna
          </Link>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #030712; color: #fff; font-family: -apple-system,'Segoe UI',sans-serif; }
        input::placeholder { color: #334155; }
        input:focus { outline: none; border-color: rgba(59,130,246,0.5) !important; background: rgba(15,23,42,0.8) !important; }
      `}</style>
    </div>
  );
}

export default function AdminLayout({ children }) {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/stream/check")
      .then((r) => r.json())
      .then((d) => { setAuthed(d.authed); setChecking(false); })
      .catch(() => setChecking(false));
  }, []);

  async function handleLogout() {
    await fetch("/api/stream/logout", { method: "POST" });
    setAuthed(false);
    router.push("/admin");
  }

  if (checking) {
    return (
      <div style={{
        minHeight: "100vh", background: "#030712",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ color: "#334155", fontSize: 14 }}>Ładowanie...</div>
      </div>
    );
  }

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />;
  }

  return (
    <AuthContext.Provider value={{ authed, logout: handleLogout }}>
      <div style={{ minHeight: "100vh", background: "#030712", display: "flex" }}>

        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 40,
              background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            }}
          />
        )}

        {/* Sidebar */}
        <aside style={{
          position: "fixed", top: 0, left: 0, bottom: 0,
          width: 220,
          background: "rgba(255,255,255,0.02)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column",
          zIndex: 50,
          transform: sidebarOpen ? "translateX(0)" : undefined,
          transition: "transform 0.25s",
        }}
          className="admin-sidebar"
        >
          {/* Logo */}
          <div style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="MKS Drawa" width={36} height={36}
              style={{ objectFit: "contain", borderRadius: 4 }} />
            <div>
              <div style={{
                fontSize: 13, fontFamily: "'Bebas Neue', Impact, sans-serif",
                letterSpacing: "0.1em", color: "#fff", lineHeight: 1,
              }}>
                MKS Drawa
              </div>
              <div style={{ fontSize: 9, color: "#3b82f6", letterSpacing: "0.2em" }}>ADMIN</div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", borderRadius: 8, textDecoration: "none",
                    fontSize: 13, fontWeight: 500,
                    color: active ? "#fff" : "#64748b",
                    background: active ? "rgba(59,130,246,0.12)" : "transparent",
                    border: active ? "1px solid rgba(59,130,246,0.2)" : "1px solid transparent",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#94a3b8"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "#64748b"; }}
                >
                  <span style={{ color: active ? "#3b82f6" : "inherit", opacity: active ? 1 : 0.6 }}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div style={{
            padding: "14px 16px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            display: "flex", gap: 10, alignItems: "center",
          }}>
            <Link href="/" style={{ fontSize: 11, color: "#334155", textDecoration: "none", flex: 1 }}>
              ← Strona
            </Link>
            <button
              onClick={handleLogout}
              style={{
                background: "none", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 6, color: "#475569", fontSize: 11,
                padding: "5px 10px", cursor: "pointer",
              }}
            >
              Wyloguj
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div style={{ flex: 1, marginLeft: 220, display: "flex", flexDirection: "column" }}
          className="admin-main"
        >
          {/* Topbar (mobile) */}
          <div style={{
            height: 52, borderBottom: "1px solid rgba(255,255,255,0.06)",
            padding: "0 16px", display: "flex", alignItems: "center", gap: 12,
          }}
            className="admin-topbar"
          >
            <button
              className="admin-hamburger"
              onClick={() => setSidebarOpen((o) => !o)}
              style={{
                display: "none",
                background: "none", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6, color: "#94a3b8",
                fontSize: 16, padding: "4px 8px", cursor: "pointer",
              }}
            >
              ☰
            </button>
            <div style={{ fontSize: 12, color: "#334155" }}>
              {NAV_ITEMS.find((i) => pathname.startsWith(i.href))?.label ?? "Dashboard"}
            </div>
          </div>

          <div style={{ flex: 1, padding: "28px 28px" }}>
            {children}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #030712; color: #fff; font-family: -apple-system,'Segoe UI',sans-serif; }
        input::placeholder { color: #334155; }
        input:focus { outline: none; border-color: rgba(59,130,246,0.5) !important; background: rgba(15,23,42,0.8) !important; }
        @media (max-width: 640px) {
          .admin-sidebar {
            transform: translateX(-100%) !important;
          }
          .admin-sidebar.open {
            transform: translateX(0) !important;
          }
          .admin-main {
            margin-left: 0 !important;
          }
          .admin-hamburger {
            display: flex !important;
          }
        }
      `}</style>
    </AuthContext.Provider>
  );
}

const labelStyle = {
  display: "block", fontSize: 11, color: "#64748b",
  fontWeight: 600, letterSpacing: "0.06em", marginBottom: 7,
};

const inputStyle = {
  width: "100%", padding: "10px 14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, color: "#fff", fontSize: 14,
  transition: "border-color 0.2s, background 0.2s",
};

const btnPrimaryStyle = {
  padding: "11px 20px", background: "#3b82f6",
  border: "none", borderRadius: 8,
  color: "#fff", fontSize: 14, fontWeight: 600,
  cursor: "pointer", letterSpacing: "0.02em",
};
