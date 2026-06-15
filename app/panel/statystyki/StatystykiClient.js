"use client";

import { useState, useEffect } from "react";

const FIELDS = [
  { key: "mecze",       label: "Mecze (liga)" },
  { key: "gole",        label: "Gole (liga)" },
  { key: "asysty",      label: "Asysty (liga)" },
  { key: "zolte",       label: "Żółte kartki" },
  { key: "czerwone",    label: "Czerwone kartki" },
  { key: "meczePuchar", label: "Mecze (puchar)" },
  { key: "golePuchar",  label: "Gole (puchar)" },
];

const emptyForm = () => Object.fromEntries(FIELDS.map((f) => [f.key, 0]));

export default function StatystykiClient() {
  const [sezon, setSezon] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/panel/stats")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setSezon(d.sezon);
        const vals = emptyForm();
        if (d.stats) FIELDS.forEach((f) => { vals[f.key] = d.stats[f.key] ?? 0; });
        setForm(vals);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const r = await fetch("/api/panel/stats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (r.ok) {
        setSuccess("Statystyki zapisane");
      } else {
        setError(d.error || "Błąd zapisu");
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
          Moje statystyki
        </div>
        <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
          {sezon ? `Sezon ${sezon}` : "Brak aktywnego sezonu"}
        </div>
      </div>

      {!sezon && !loading && (
        <div style={alertErr}>Admin nie ustawił jeszcze aktywnego sezonu.</div>
      )}

      {loading ? (
        <div style={{ color: "#475569", fontSize: 13 }}>Ładowanie...</div>
      ) : sezon ? (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <label style={lbl}>{label.toUpperCase()}</label>
                  <input
                    type="number"
                    min="0"
                    value={form[key] ?? 0}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    style={inp}
                  />
                </div>
              ))}
            </div>
          </div>

          {error && <div style={alertErr}>{error}</div>}
          {success && <div style={alertOk}>{success}</div>}

          <button type="submit" disabled={saving} style={btnPrimary}>
            {saving ? "Zapisuję..." : "Zapisz statystyki"}
          </button>
        </form>
      ) : null}

      <style>{`
        input[type=number]::-webkit-inner-spin-button { opacity: 0.3; }
        input:focus { outline: none; border-color: rgba(59,130,246,0.5) !important; }
      `}</style>
    </div>
  );
}

const card = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "20px" };
const lbl = { display: "block", fontSize: 10, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 6 };
const inp = { width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 15, fontWeight: 600 };
const btnPrimary = { padding: "11px 20px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" };
const alertErr = { fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "9px 13px" };
const alertOk = { fontSize: 13, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 7, padding: "9px 13px" };
