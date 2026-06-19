"use client";

import { useState, useEffect } from "react";

const FIELDS = [
  { key: "adres",        label: "ADRES STADIONU",       placeholder: "ul. Choszczeńska 85a, 73-220 Drawno" },
  { key: "adresLink",    label: "LINK DO MAP",           placeholder: "https://maps.google.com/..." },
  { key: "telefon",      label: "TELEFON",               placeholder: "691 901 479" },
  { key: "telefonOpis",  label: "OPIS TELEFONU",         placeholder: "Prezes – Jakub Zygała" },
  { key: "emailKlub",    label: "EMAIL KLUBU",           placeholder: "drawa.drawno@zzpn.pl" },
  { key: "emailPrezes",  label: "EMAIL PREZESA",         placeholder: "jakub.zygala05@o2.pl" },
  { key: "facebook",     label: "FACEBOOK URL",          placeholder: "https://www.facebook.com/..." },
  { key: "instagram",    label: "INSTAGRAM URL",         placeholder: "https://www.instagram.com/..." },
  { key: "youtube",      label: "YOUTUBE URL",           placeholder: "https://www.youtube.com/@MKS_DRAWA_DRAWNO" },
  { key: "liga",         label: "NAZWA LIGI",            placeholder: "A klasa" },
  { key: "ligaLink",     label: "LINK DO ROZGRYWEK",    placeholder: "https://rozgrywki.zzpn.pl/..." },
  { key: "ligaSezon",    label: "SEZON LIGI",            placeholder: "2025/26" },
];

export default function KontaktAdmin() {
  const [form, setForm] = useState(Object.fromEntries(FIELDS.map(f => [f.key, ""])));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/ustawienia")
      .then(r => r.json())
      .then(d => {
        if (!cancelled) setForm(prev => ({ ...prev, ...d }));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      const r = await fetch("/api/admin/ustawienia", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) { const d = await r.json(); setError(d.error || "Błąd"); return; }
      setSuccess("Zapisano ustawienia kontaktu");
      setTimeout(() => setSuccess(""), 3000);
    } catch { setError("Błąd połączenia"); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ fontSize: "clamp(20px,4vw,28px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff", marginBottom: 8 }}>
        Dane kontaktowe
      </div>
      <div style={{ fontSize: 12, color: "#475569", marginBottom: 24 }}>
        Dane wyświetlane w sekcji Kontakt na stronie głównej
      </div>

      {loading ? (
        <div style={{ color: "#475569", fontSize: 13 }}>Ładowanie...</div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={card}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {FIELDS.map(f => (
                <div key={f.key}>
                  <label style={lbl}>{f.label}</label>
                  <input
                    style={inp}
                    value={form[f.key] || ""}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>

          {error && <div style={alertErr}>{error}</div>}
          {success && <div style={alertOk}>{success}</div>}

          <button type="submit" disabled={saving} style={btnPrimary}>
            {saving ? "Zapisuję..." : "Zapisz dane kontaktowe"}
          </button>
        </form>
      )}
      <style>{`input:focus{outline:none;border-color:rgba(59,130,246,0.5)!important}*{box-sizing:border-box}`}</style>
    </div>
  );
}

const card = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "20px" };
const lbl = { display: "block", fontSize: 10, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 6 };
const inp = { width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#fff", fontSize: 13 };
const btnPrimary = { padding: "9px 18px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const alertErr = { fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "9px 13px" };
const alertOk = { fontSize: 13, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 7, padding: "9px 13px" };
