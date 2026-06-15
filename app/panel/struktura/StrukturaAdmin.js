"use client";

import { useState, useEffect } from "react";

const emptyForm = () => ({ rola: "", imie: "", telefon: "", email: "", kolejnosc: 0, aktywny: true });

export default function StrukturaAdmin() {
  const [osoby, setOsoby] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/struktura")
      .then(r => r.json())
      .then(d => { if (!cancelled) setOsoby(Array.isArray(d) ? d : []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tick]);

  function openCreate() {
    setEditId(null); setForm(emptyForm()); setError(""); setSuccess(""); setView("form");
  }

  function openEdit(o) {
    setEditId(o.id);
    setForm({ rola: o.rola, imie: o.imie, telefon: o.telefon || "", email: o.email || "", kolejnosc: o.kolejnosc, aktywny: o.aktywny });
    setError(""); setSuccess(""); setView("form");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      const url = editId ? `/api/admin/struktura/${editId}` : "/api/admin/struktura";
      const r = await fetch(url, { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, kolejnosc: Number(form.kolejnosc) || 0 }) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Błąd"); setSaving(false); return; }
      setSuccess(editId ? "Zapisano" : "Dodano osobę");
      setTick(t => t + 1); setView("list");
    } catch { setError("Błąd połączenia"); }
    finally { setSaving(false); }
  }

  async function toggleActive(o) {
    await fetch(`/api/admin/struktura/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aktywny: !o.aktywny }) });
    setTick(t => t + 1);
  }

  async function handleDelete(o) {
    if (!confirm(`Usunąć ${o.imie}?`)) return;
    await fetch(`/api/admin/struktura/${o.id}`, { method: "DELETE" });
    setTick(t => t + 1);
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const ROLE_SUGGESTIONS = ["Prezes", "Wiceprezes", "Sekretarz", "Skarbnik", "Kierownik drużyny", "Trener", "Asystent trenera"];

  if (view === "form") return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <button onClick={() => setView("list")} style={btnGhost}>← Wróć</button>
        <div style={{ fontSize: "clamp(18px,4vw,26px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>
          {editId ? "Edytuj osobę" : "Nowa osoba"}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={card}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={lbl}>ROLA / STANOWISKO *</label>
              <input style={inp} list="role-list" value={form.rola} onChange={f("rola")} required placeholder="Prezes, Wiceprezes..." />
              <datalist id="role-list">
                {ROLE_SUGGESTIONS.map(r => <option key={r} value={r} />)}
              </datalist>
            </div>
            <div>
              <label style={lbl}>IMIĘ I NAZWISKO *</label>
              <input style={inp} value={form.imie} onChange={f("imie")} required placeholder="Jan Kowalski" />
            </div>
            <div>
              <label style={lbl}>TELEFON</label>
              <input style={inp} value={form.telefon} onChange={f("telefon")} placeholder="691 901 479" />
            </div>
            <div>
              <label style={lbl}>EMAIL</label>
              <input style={inp} type="email" value={form.email} onChange={f("email")} placeholder="jan@example.com" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={lbl}>KOLEJNOŚĆ</label>
                <input style={inp} type="number" value={form.kolejnosc} onChange={f("kolejnosc")} min={0} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#94a3b8" }}>
                  <input type="checkbox" checked={form.aktywny} onChange={e => setForm(p => ({ ...p, aktywny: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "#3b82f6" }} />
                  Aktywny
                </label>
              </div>
            </div>
          </div>
        </div>

        {error && <div style={alertErr}>{error}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={saving} style={btnPrimary}>{saving ? "Zapisuję..." : editId ? "Zapisz" : "Dodaj"}</button>
          <button type="button" onClick={() => setView("list")} style={btnGhost}>Anuluj</button>
        </div>
      </form>
      <style>{`input:focus{outline:none;border-color:rgba(59,130,246,0.5)!important}*{box-sizing:border-box}`}</style>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: "clamp(20px,4vw,28px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>Struktura Klubu</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>Zarząd i sztab szkoleniowy</div>
        </div>
        <button onClick={openCreate} style={btnPrimary}>+ Dodaj osobę</button>
      </div>

      {success && <div style={{ ...alertOk, marginBottom: 16 }}>{success}</div>}

      {loading ? (
        <div style={{ color: "#475569", fontSize: 13 }}>Ładowanie...</div>
      ) : osoby.length === 0 ? (
        <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: 20 }}>Brak osób.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {osoby.map(o => (
            <div key={o.id} style={{ ...card, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontFamily: "'Bebas Neue',Impact,sans-serif", color: "#60a5fa", flexShrink: 0 }}>
                {o.imie.split(" ").map(s => s[0]).join("").slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: o.aktywny ? "#fff" : "#475569" }}>{o.imie}</div>
                <div style={{ fontSize: 11, color: "#334155", marginTop: 1 }}>
                  {o.rola}{o.telefon ? ` · ${o.telefon}` : ""}{o.email ? ` · ${o.email}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button onClick={() => toggleActive(o)} style={{ ...btnRowAction, color: o.aktywny ? "#22c55e" : "#475569", borderColor: o.aktywny ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)" }}>
                  {o.aktywny ? "Aktywny" : "Ukryty"}
                </button>
                <button onClick={() => openEdit(o)} style={btnRowAction}>Edytuj</button>
                <button onClick={() => handleDelete(o)} style={{ ...btnRowAction, color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" }}>Usuń</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`*{box-sizing:border-box}`}</style>
    </div>
  );
}

const card = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "20px" };
const lbl = { display: "block", fontSize: 10, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 6 };
const inp = { width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#fff", fontSize: 13 };
const btnPrimary = { padding: "9px 18px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnGhost = { padding: "9px 14px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#64748b", fontSize: 13, cursor: "pointer" };
const btnRowAction = { padding: "4px 9px", background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#64748b", fontSize: 11, cursor: "pointer" };
const alertErr = { fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "9px 13px" };
const alertOk = { fontSize: 13, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 7, padding: "9px 13px" };
