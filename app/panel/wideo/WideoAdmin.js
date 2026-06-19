"use client";

import { useState, useEffect } from "react";

const card = { background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20 };
const inp = { width: "100%", background: "#1e293b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#fff", fontSize: 13, padding: "8px 12px" };
const lbl = { fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#475569", marginBottom: 6, display: "block" };
const btnPrimary = { padding: "10px 24px", borderRadius: 8, background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.4)", color: "#3b82f6", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", cursor: "pointer" };
const btnGhost = { padding: "8px 16px", borderRadius: 6, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontSize: 12, cursor: "pointer" };
const btnDanger = { padding: "6px 12px", borderRadius: 6, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: 11, cursor: "pointer" };

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function isShort(url) {
  return url?.includes('/shorts/');
}

export default function WideoAdmin() {
  const [filmy, setFilmy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ url: "", tytul: "", typ: "video", kolejnosc: 0, published: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    fetch("/api/admin/wideo").then(r => r.json()).then(d => setFilmy(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, [tick]);

  function openCreate() {
    setEditId(null);
    setForm({ url: "", tytul: "", typ: "video", kolejnosc: 0, published: true });
    setError(""); setSuccess(""); setView("form");
  }

  function openEdit(f) {
    setEditId(f.id);
    setForm({ url: f.url, tytul: f.tytul, typ: f.typ, kolejnosc: f.kolejnosc, published: f.published });
    setError(""); setSuccess(""); setView("form");
  }

  function handleUrlChange(url) {
    const typ = isShort(url) ? "short" : "video";
    setForm(p => ({ ...p, url, typ }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      const apiUrl = editId ? `/api/admin/wideo/${editId}` : "/api/admin/wideo";
      const r = await fetch(apiUrl, { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Błąd"); setSaving(false); return; }
      setSuccess(editId ? "Zapisano" : "Dodano film");
      setTick(t => t + 1); setView("list");
    } catch { setError("Błąd połączenia"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Usunąć film?")) return;
    await fetch(`/api/admin/wideo/${id}`, { method: "DELETE" });
    setTick(t => t + 1);
  }

  async function togglePublished(f) {
    await fetch(`/api/admin/wideo/${f.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published: !f.published }) });
    setTick(t => t + 1);
  }

  if (view === "form") return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ fontSize: "clamp(20px,4vw,28px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff", marginBottom: 16 }}>
        {editId ? "Edytuj film" : "Nowy film"}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={card}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={lbl}>URL YOUTUBE</label>
              <input style={inp} value={form.url} onChange={e => handleUrlChange(e.target.value)} placeholder="https://www.youtube.com/watch?v=... lub /shorts/..." />
              {form.url && !getYouTubeId(form.url) && (
                <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>Nieprawidłowy URL YouTube</div>
              )}
            </div>
            <div>
              <label style={lbl}>TYTUŁ</label>
              <input style={inp} value={form.tytul} onChange={e => setForm(p => ({ ...p, tytul: e.target.value }))} placeholder="Tytuł filmu" />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>TYP</label>
                <select style={{ ...inp, cursor: "pointer" }} value={form.typ} onChange={e => setForm(p => ({ ...p, typ: e.target.value }))}>
                  <option value="video">Film</option>
                  <option value="short">Short</option>
                </select>
              </div>
              <div style={{ width: 100 }}>
                <label style={lbl}>KOLEJNOŚĆ</label>
                <input style={inp} type="number" value={form.kolejnosc} onChange={e => setForm(p => ({ ...p, kolejnosc: Number(e.target.value) }))} />
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "#94a3b8" }}>
              <input type="checkbox" checked={form.published} onChange={e => setForm(p => ({ ...p, published: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "#3b82f6" }} />
              Opublikowany
            </label>
          </div>

          {getYouTubeId(form.url) && (
            <div style={{ marginTop: 16, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeId(form.url)}`}
                style={{ width: "100%", height: form.typ === "short" ? 400 : 220, border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>

        {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 16px", color: "#ef4444", fontSize: 13 }}>{error}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={saving} style={btnPrimary}>{saving ? "Zapisuję..." : editId ? "Zapisz" : "Dodaj film"}</button>
          <button type="button" onClick={() => setView("list")} style={btnGhost}>Anuluj</button>
        </div>
      </form>

      <style>{`input:focus, select:focus { outline: none; border-color: rgba(59,130,246,0.5) !important; }`}</style>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: "clamp(20px,4vw,28px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>Wideo</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{filmy.length} filmów</div>
        </div>
        <button onClick={openCreate} style={btnPrimary}>+ Dodaj film</button>
      </div>

      {success && <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "10px 16px", color: "#22c55e", fontSize: 13, marginBottom: 16 }}>{success}</div>}

      {loading ? (
        <div style={{ color: "#475569", fontSize: 13 }}>Ładowanie...</div>
      ) : filmy.length === 0 ? (
        <div style={{ color: "#475569", fontSize: 13, padding: 20, textAlign: "center" }}>Brak filmów. Dodaj pierwszy!</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filmy.map(f => {
            const ytId = getYouTubeId(f.url);
            return (
              <div key={f.id} style={{ ...card, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
                {ytId && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" style={{ width: 80, height: 45, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: f.published ? "#fff" : "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {f.tytul}
                  </div>
                  <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>
                    {f.typ === "short" ? "SHORT" : "VIDEO"} · #{f.kolejnosc}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => togglePublished(f)} style={{ ...btnGhost, fontSize: 10, padding: "4px 10px", color: f.published ? "#22c55e" : "#475569" }}>
                    {f.published ? "ON" : "OFF"}
                  </button>
                  <button onClick={() => openEdit(f)} style={{ ...btnGhost, fontSize: 10, padding: "4px 10px" }}>Edytuj</button>
                  <button onClick={() => handleDelete(f.id)} style={{ ...btnDanger, fontSize: 10, padding: "4px 10px" }}>Usuń</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
