"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";

function LoginForm() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.user) router.replace(next || "/panel"); });
  }, [router, next]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const d = await r.json();
      if (r.ok) {
        router.push(next || d.redirect || "/panel");
      } else {
        setError(d.error || "Błąd logowania");
      }
    } catch {
      setError("Błąd połączenia");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Image src="/logo.png" alt="MKS Drawa" width={56} height={56}
            style={{ objectFit: "contain", borderRadius: 4, marginBottom: 12 }} />
          <div style={{ fontSize: 22, fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>
            Logowanie
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>MKS Drawa Drawno</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={lbl}>Login</label>
            <input
              type="text" value={login} onChange={(e) => setLogin(e.target.value)}
              style={inp} autoComplete="username" required placeholder="twój login"
              autoFocus
            />
          </div>
          <div>
            <label style={lbl}>Hasło</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              style={inp} autoComplete="current-password" required placeholder="••••••"
            />
          </div>

          {error && <div style={alertErr}>{error}</div>}

          <button type="submit" disabled={loading} style={btnPrimary}>
            {loading ? "Logowanie..." : "Zaloguj się"}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: "center" }}>
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

const pageStyle = { minHeight: "100vh", background: "#030712", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };
const cardStyle = { width: "100%", maxWidth: 380, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "32px 28px" };
const lbl = { display: "block", fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 7 };
const inp = { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 14, transition: "border-color 0.2s" };
const btnPrimary = { padding: "11px 20px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" };
const alertErr = { fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "9px 13px" };
