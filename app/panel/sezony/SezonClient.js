"use client";

import { useState, useEffect } from "react";

export default function SezonClient() {
  const [sezony, setSezony] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNazwa, setNewNazwa] = useState("");
  const [newAktywny, setNewAktywny] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/sezony")
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setSezony(Array.isArray(d) ? d : []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tick]);

  const load = () => setTick((t) => t + 1);

  async function handleCreate(e) {
    e.preventDefault();
    setError(""); setSuccess(""); setSaving(true);
    try {
      const r = await fetch("/api/admin/sezony", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nazwa: newNazwa, aktywny: newAktywny }),
      });
      const d = await r.json();
      if (r.ok) {
        setSuccess(`Sezon "${d.nazwa}" utworzony`);
        setNewNazwa(""); setNewAktywny(false);
        load();
      } else {
        setError(d.error || "Błąd");
      }
    } catch { setError("Błąd połączenia"); }
    finally { setSaving(false); }
  }

  async function setAktywny(id) {
    setError(""); setSuccess("");
    const r = await fetch(`/api/admin/sezony/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aktywny: true }),
    });
    if (r.ok) { setSuccess("Aktywny sezon zmieniony"); load(); }
    else { const d = await r.json(); setError(d.error || "Błąd"); }
  }

  async function handleDelete(id, nazwa) {
    if (!confirm(`Usunąć sezon "${nazwa}"? Tej operacji nie można cofnąć.`)) return;
    const r = await fetch(`/api/admin/sezony/${id}`, { method: "DELETE" });
    const d = await r.json();
    if (r.ok) { load(); }
    else { setError(d.error || "Błąd"); }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: "clamp(20px,4vw,28px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>
          Sezony
        </div>
        <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>Zarządzanie sezonami i statystykami</div>
      </div>

      {/* Nowy sezon */}
      <div style={card}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", marginBottom: 14 }}>NOWY SEZON</div>
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={lbl}>NAZWA (np. 2025/26)</label>
            <input
              value={newNazwa}
              onChange={(e) => setNewNazwa(e.target.value)}
              style={inp}
              placeholder="2025/26"
              required
            />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "#94a3b8" }}>
            <input
              type="checkbox"
              checked={newAktywny}
              onChange={(e) => setNewAktywny(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "#3b82f6" }}
            />
            Ustaw jako aktywny sezon
          </label>
          <button type="submit" disabled={saving} style={btnPrimary}>
            {saving ? "Tworzę..." : "Utwórz sezon"}
          </button>
        </form>
      </div>

      {error && <div style={{ ...alertErr, marginTop: 12 }}>{error}</div>}
      {success && <div style={{ ...alertOk, marginTop: 12 }}>{success}</div>}

      {/* Lista sezonów */}
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? (
          <div style={{ color: "#475569", fontSize: 13 }}>Ładowanie...</div>
        ) : sezony.length === 0 ? (
          <div style={{ color: "#475569", fontSize: 13 }}>Brak sezonów</div>
        ) : sezony.map((s) => (
          <div key={s.id} style={{ ...card, display: "flex", alignItems: "center", gap: 12, padding: "14px 18px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: s.aktywny ? "#3b82f6" : "#fff" }}>
                {s.nazwa}
                {s.aktywny && <span style={{ marginLeft: 8, fontSize: 10, color: "#22c55e", fontWeight: 600, letterSpacing: "0.08em" }}>● AKTYWNY</span>}
              </div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                {s._count?.stats ?? 0} wpisów statystyk
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {!s.aktywny && (
                <button onClick={() => setAktywny(s.id)} style={btnSmall}>
                  Aktywuj
                </button>
              )}
              {!s.aktywny && (s._count?.stats ?? 0) === 0 && (
                <button onClick={() => handleDelete(s.id, s.nazwa)} style={{ ...btnSmall, color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}>
                  Usuń
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        input:focus { outline: none; border-color: rgba(59,130,246,0.5) !important; }
      `}</style>
    </div>
  );
}

const card = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "20px" };
const lbl = { display: "block", fontSize: 10, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 6 };
const inp = { width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 14 };
const btnPrimary = { padding: "10px 20px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%" };
const btnSmall = { padding: "5px 12px", background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#94a3b8", fontSize: 11, fontWeight: 600, cursor: "pointer" };
const alertErr = { fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "9px 13px" };
const alertOk = { fontSize: 13, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 7, padding: "9px 13px" };
