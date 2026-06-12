"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function KontoPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) { router.replace("/login"); return; }
        setUser(d.user);
        setLoading(false);
      });
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function handlePwChange(e) {
    e.preventDefault();
    setPwError("");
    if (next !== confirm) { setPwError("Hasła nie są identyczne"); return; }
    if (next.length < 6) { setPwError("Min. 6 znaków"); return; }
    setSaving(true);
    try {
      const r = await fetch("/api/auth/haslo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const d = await r.json();
      if (r.ok) {
        setUser((u) => ({ ...u, mustChangePassword: false }));
        setPwSuccess("Hasło zmienione — jesteś zalogowany!");
        setCurrent(""); setNext(""); setConfirm("");
        setTimeout(() => setPwSuccess(""), 4000);
      } else {
        setPwError(d.error || "Błąd");
      }
    } catch {
      setPwError("Błąd połączenia");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={{ width: 24, height: 24, border: "2px solid #1e293b", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const roleLabel = { ADMIN: "Administrator", PLAYER: "Piłkarz", STAFF: "Sztab" }[user.role] ?? user.role;
  const initials = (user.player?.imieNazwisko || user.login).charAt(0).toUpperCase();

  // Pierwsze logowanie — wymuś zmianę hasła
  if (user.mustChangePassword) {
    return (
      <div style={pageStyle}>
        <div style={{ ...cardStyle, maxWidth: 400 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 22 }}>
              🔑
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>Zmień hasło</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>
              Cześć <strong style={{ color: "#fff" }}>{user.player?.imieNazwisko || user.login}</strong>!<br />
              Przed pierwszym wejściem ustaw własne hasło.
            </div>
          </div>

          <form onSubmit={handlePwChange} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={lbl}>Hasło tymczasowe (otrzymane od admina)</label>
              <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)}
                style={inp} required autoComplete="current-password" placeholder="••••••" autoFocus />
            </div>
            <div>
              <label style={lbl}>Nowe hasło</label>
              <input type="password" value={next} onChange={(e) => setNext(e.target.value)}
                style={inp} required autoComplete="new-password" placeholder="min. 6 znaków" />
            </div>
            <div>
              <label style={lbl}>Powtórz nowe hasło</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                style={inp} required autoComplete="new-password" placeholder="••••••" />
            </div>

            {pwError && <div style={alertErr}>{pwError}</div>}
            {pwSuccess && <div style={alertOk}>{pwSuccess}</div>}

            <button type="submit" disabled={saving} style={{ ...btnPrimary, marginTop: 4 }}>
              {saving ? "Zmieniam..." : "Ustaw hasło i wejdź"}
            </button>
          </form>
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

  return (
    <div style={pageStyle}>
      <div style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 16 }}>

        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#3b82f6" }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>
                  {user.player?.imieNazwisko || user.login}
                </div>
                <div style={{ fontSize: 12, color: "#475569" }}>@{user.login} · {roleLabel}</div>
              </div>
            </div>
            <button onClick={handleLogout} style={btnGhost}>Wyloguj</button>
          </div>

          {user.player && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[{ label: "Pozycja", value: user.player.pozycja }, { label: "Numer", value: user.player.numer }]
                .filter((r) => r.value)
                .map((row) => (
                  <div key={row.label} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: "#475569", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 3 }}>{row.label.toUpperCase()}</div>
                    <div style={{ fontSize: 14, color: "#fff" }}>{row.value}</div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 16 }}>Zmień hasło</div>
          <form onSubmit={handlePwChange} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={lbl}>Aktualne hasło</label>
              <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} style={inp} required autoComplete="current-password" placeholder="••••••" />
            </div>
            <div>
              <label style={lbl}>Nowe hasło</label>
              <input type="password" value={next} onChange={(e) => setNext(e.target.value)} style={inp} required autoComplete="new-password" placeholder="min. 6 znaków" />
            </div>
            <div>
              <label style={lbl}>Powtórz nowe hasło</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={inp} required autoComplete="new-password" placeholder="••••••" />
            </div>
            {pwError && <div style={alertErr}>{pwError}</div>}
            {pwSuccess && <div style={alertOk}>{pwSuccess}</div>}
            <button type="submit" disabled={saving} style={btnPrimary}>{saving ? "Zmieniam..." : "Zmień hasło"}</button>
          </form>
        </div>

        <div style={{ textAlign: "center" }}>
          <Link href="/" style={{ fontSize: 12, color: "#334155", textDecoration: "none" }}>← Strona główna</Link>
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

const pageStyle = { minHeight: "100vh", background: "#030712", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };
const cardStyle = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "22px 22px" };
const lbl = { display: "block", fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 7 };
const inp = { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 14, transition: "border-color 0.2s" };
const btnPrimary = { padding: "10px 20px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" };
const btnGhost = { padding: "6px 12px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#64748b", fontSize: 12, cursor: "pointer" };
const alertErr = { fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "9px 13px" };
const alertOk = { fontSize: 13, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 7, padding: "9px 13px" };
