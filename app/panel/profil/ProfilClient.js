"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLE_LABEL = { ADMIN: "Administrator", PLAYER: "Piłkarz", STAFF: "Sztab" };

export default function ProfilClient({ login, email, role, player }) {
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [fotoUrl, setFotoUrl] = useState(player?.foto ?? null);
  const [fotoUploading, setFotoUploading] = useState(false);
  const [fotoError, setFotoError] = useState("");
  const router = useRouter();

  const displayName = player?.imieNazwisko || login;
  const initials = displayName.charAt(0).toUpperCase();

  async function handleFotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoError("");
    setFotoUploading(true);
    try {
      const fd = new FormData();
      fd.append("foto", file);
      const r = await fetch("/api/panel/foto", { method: "POST", body: fd });
      const d = await r.json();
      if (r.ok) {
        setFotoUrl(d.foto + "?t=" + Date.now());
        router.refresh();
      } else {
        setFotoError(d.error || "Błąd uploadu");
      }
    } catch {
      setFotoError("Błąd połączenia");
    } finally {
      setFotoUploading(false);
    }
  }

  async function handlePwChange(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPw !== confirm) { setError("Hasła nie są identyczne"); return; }
    if (newPw.length < 6) { setError("Min. 6 znaków"); return; }

    setSaving(true);
    try {
      const r = await fetch("/api/auth/haslo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: newPw }),
      });
      const d = await r.json();
      if (r.ok) {
        setCurrent(""); setNewPw(""); setConfirm("");
        setShowForm(false);
        setSuccess("Hasło zmienione pomyślnie");
        router.refresh();
      } else {
        setError(d.error || "Błąd");
      }
    } catch {
      setError("Błąd połączenia");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: "clamp(20px,4vw,28px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>
          Profil
        </div>
        <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>Twoje konto</div>
      </div>

      {/* Karta użytkownika */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: player ? 20 : 0 }}>
          <label style={{ position: "relative", cursor: "pointer", flexShrink: 0 }} title="Zmień zdjęcie">
            <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleFotoUpload} disabled={fotoUploading} />
            {fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fotoUrl} alt="Zdjęcie" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: "2px solid rgba(59,130,246,0.35)" }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#3b82f6" }}>
                {initials}
              </div>
            )}
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 18, height: 18, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
              {fotoUploading ? "…" : "✎"}
            </div>
          </label>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{displayName}</div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>@{login} · {ROLE_LABEL[role] ?? role}</div>
            {email && <div style={{ fontSize: 11, color: "#334155", marginTop: 1 }}>{email}</div>}
          </div>
        </div>

        {player && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Pozycja", value: player.pozycja },
              { label: "Numer", value: player.numer },
            ].filter((r) => r.value != null).map((row) => (
              <div key={row.label} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: "#475569", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 3 }}>{row.label.toUpperCase()}</div>
                <div style={{ fontSize: 14, color: "#fff" }}>{row.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {fotoError && <div style={{ ...alertErr, marginTop: 8 }}>{fotoError}</div>}

      {/* Zmiana hasła */}
      <div style={{ ...card, marginTop: 16 }}>
        <button
          onClick={() => { setShowForm((v) => !v); setError(""); setSuccess(""); setCurrent(""); setNewPw(""); setConfirm(""); }}
          style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", padding: 0 }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>Zmień hasło</span>
          <span style={{ fontSize: 18, color: "#475569", lineHeight: 1 }}>{showForm ? "−" : "+"}</span>
        </button>

        {showForm && (
          <form onSubmit={handlePwChange} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
            <div>
              <label style={lbl}>Aktualne hasło</label>
              <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} style={inp} required autoComplete="current-password" placeholder="••••••" autoFocus />
            </div>
            <div>
              <label style={lbl}>Nowe hasło</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} style={inp} required autoComplete="new-password" placeholder="min. 6 znaków" />
            </div>
            <div>
              <label style={lbl}>Powtórz nowe hasło</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={inp} required autoComplete="new-password" placeholder="••••••" />
            </div>
            {error && <div style={alertErr}>{error}</div>}
            <button type="submit" disabled={saving} style={btnPrimary}>{saving ? "Zapisuję..." : "Zmień hasło"}</button>
          </form>
        )}

        {success && <div style={{ ...alertOk, marginTop: 12 }}>{success}</div>}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #334155; }
        input:focus { outline: none; border-color: rgba(59,130,246,0.5) !important; background: rgba(15,23,42,0.8) !important; }
      `}</style>
    </div>
  );
}

const card = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "20px 20px" };
const lbl = { display: "block", fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 7 };
const inp = { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 14, transition: "border-color 0.2s" };
const btnPrimary = { padding: "10px 20px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" };
const alertErr = { fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "9px 13px" };
const alertOk = { fontSize: 13, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 7, padding: "9px 13px" };
