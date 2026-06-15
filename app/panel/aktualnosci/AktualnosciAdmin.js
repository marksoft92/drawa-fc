"use client";

import { useState, useEffect } from "react";

const emptyForm = () => ({
  title: "", slug: "", excerpt: "", content: "",
  thumbnail: "", kolor: "#3b82f6", tags: "", date: new Date().toISOString().slice(0, 10),
  photos: [{ src: "", caption: "" }], published: true,
});

function slugify(str) {
  return str.toLowerCase()
    .replace(/ą/g,"a").replace(/ć/g,"c").replace(/ę/g,"e").replace(/ł/g,"l")
    .replace(/ń/g,"n").replace(/ó/g,"o").replace(/ś/g,"s").replace(/ź/g,"z").replace(/ż/g,"z")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}

export default function AktualnosciAdmin() {
  const [artykuly, setArtykuly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // "list" | "form"
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/artykuly")
      .then(r => r.json())
      .then(d => { if (!cancelled) setArtykuly(Array.isArray(d) ? d : []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tick]);

  function openCreate() {
    setEditId(null);
    setForm(emptyForm());
    setError(""); setSuccess("");
    setView("form");
  }

  async function openEdit(id) {
    setError(""); setSuccess("");
    const r = await fetch(`/api/admin/artykuly/${id}`);
    const d = await r.json();
    setEditId(id);
    setForm({
      title: d.title, slug: d.slug, excerpt: d.excerpt, content: d.content,
      thumbnail: d.thumbnail || "", kolor: d.kolor || "#3b82f6",
      tags: (d.tags || []).join(", "), date: d.date,
      photos: d.photos?.length ? d.photos : [{ src: "", caption: "" }],
      published: d.published,
    });
    setView("form");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSaving(true);
    const payload = {
      ...form,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      photos: form.photos.filter(p => p.src.trim()),
      thumbnail: form.thumbnail.trim() || null,
      kolor: form.kolor.trim() || null,
    };
    try {
      const url = editId ? `/api/admin/artykuly/${editId}` : "/api/admin/artykuly";
      const method = editId ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Błąd"); setSaving(false); return; }
      setSuccess(editId ? "Zapisano zmiany" : "Artykuł utworzony");
      setTick(t => t + 1);
      setView("list");
    } catch { setError("Błąd połączenia"); }
    finally { setSaving(false); }
  }

  async function togglePublished(a) {
    await fetch(`/api/admin/artykuly/${a.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !a.published }),
    });
    setTick(t => t + 1);
  }

  async function handleDelete(a) {
    if (!confirm(`Usunąć "${a.title}"? Tej operacji nie można cofnąć.`)) return;
    await fetch(`/api/admin/artykuly/${a.id}`, { method: "DELETE" });
    setTick(t => t + 1);
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setPhoto = (i, k, v) => setForm(p => {
    const photos = [...p.photos];
    photos[i] = { ...photos[i], [k]: v };
    return { ...p, photos };
  });
  const addPhoto = () => setForm(p => ({ ...p, photos: [...p.photos, { src: "", caption: "" }] }));
  const removePhoto = i => setForm(p => ({ ...p, photos: p.photos.filter((_, j) => j !== i) }));

  if (view === "form") return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <button onClick={() => setView("list")} style={btnGhost}>← Wróć</button>
        <div style={{ fontSize: "clamp(18px,4vw,26px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>
          {editId ? "Edytuj artykuł" : "Nowy artykuł"}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={card}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>TYTUŁ *</label>
              <input style={inp} value={form.title} onChange={e => {
                const title = e.target.value;
                setForm(p => ({ ...p, title, slug: p.slug || slugify(title) }));
              }} required placeholder="Tytuł artykułu" />
            </div>
            <div>
              <label style={lbl}>SLUG *</label>
              <input style={inp} value={form.slug} onChange={f("slug")} required placeholder="url-artykulu" />
            </div>
            <div>
              <label style={lbl}>DATA</label>
              <input style={inp} type="date" value={form.date} onChange={f("date")} />
            </div>
            <div>
              <label style={lbl}>MINIATURKA (ścieżka lub URL)</label>
              <input style={inp} value={form.thumbnail} onChange={f("thumbnail")} placeholder="/aktualnosci/zdjecie.jpg" />
            </div>
            <div>
              <label style={lbl}>KOLOR AKCENTU</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="color" value={form.kolor} onChange={f("kolor")} style={{ width: 40, height: 36, border: "none", background: "none", cursor: "pointer" }} />
                <input style={{ ...inp, flex: 1 }} value={form.kolor} onChange={f("kolor")} placeholder="#3b82f6" />
              </div>
            </div>
            <div>
              <label style={lbl}>TAGI (oddziel przecinkami)</label>
              <input style={inp} value={form.tags} onChange={f("tags")} placeholder="wynik, liga, puchar" />
            </div>
          </div>
        </div>

        <div style={card}>
          <label style={lbl}>ZAJAWKA</label>
          <textarea style={{ ...inp, height: 70, resize: "vertical" }} value={form.excerpt} onChange={f("excerpt")} placeholder="Krótki opis widoczny na liście..." />
        </div>

        <div style={card}>
          <label style={lbl}>TREŚĆ (akapity oddziel pustą linią)</label>
          <textarea style={{ ...inp, height: 280, resize: "vertical", fontFamily: "monospace", fontSize: 13 }} value={form.content} onChange={f("content")} placeholder="Treść artykułu..." />
        </div>

        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <label style={{ ...lbl, marginBottom: 0 }}>ZDJĘCIA</label>
            <button type="button" onClick={addPhoto} style={{ ...btnGhost, fontSize: 11, padding: "4px 10px" }}>+ Dodaj zdjęcie</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {form.photos.map((p, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "center" }}>
                <input style={inp} value={p.src} onChange={e => setPhoto(i, "src", e.target.value)} placeholder="/aktualnosci/zdjecie.jpg" />
                <input style={inp} value={p.caption} onChange={e => setPhoto(i, "caption", e.target.value)} placeholder="Podpis (opcjonalnie)" />
                <button type="button" onClick={() => removePhoto(i)} style={{ ...btnGhost, color: "#ef4444", padding: "8px 10px" }}>✕</button>
              </div>
            ))}
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "#94a3b8" }}>
          <input type="checkbox" checked={form.published} onChange={e => setForm(p => ({ ...p, published: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "#3b82f6" }} />
          Opublikowany (widoczny na stronie)
        </label>

        {error && <div style={alertErr}>{error}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={saving} style={btnPrimary}>{saving ? "Zapisuję..." : editId ? "Zapisz zmiany" : "Opublikuj"}</button>
          <button type="button" onClick={() => setView("list")} style={btnGhost}>Anuluj</button>
        </div>
      </form>

      <style>{`input:focus,textarea:focus,select:focus{outline:none;border-color:rgba(59,130,246,0.5)!important;} input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.4);}`}</style>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: "clamp(20px,4vw,28px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>Aktualności</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{artykuly.length} artykułów</div>
        </div>
        <button onClick={openCreate} style={btnPrimary}>+ Nowy artykuł</button>
      </div>

      {success && <div style={{ ...alertOk, marginBottom: 16 }}>{success}</div>}

      {loading ? (
        <div style={{ color: "#475569", fontSize: 13 }}>Ładowanie...</div>
      ) : artykuly.length === 0 ? (
        <div style={{ color: "#475569", fontSize: 13, padding: 20, textAlign: "center" }}>Brak artykułów.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {artykuly.map(a => (
            <div key={a.id} style={{ ...card, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
              <div style={{ width: 4, height: 36, borderRadius: 2, background: "#3b82f6", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: a.published ? "#fff" : "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {a.title}
                </div>
                <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>
                  {a.date} · {(a.tags || []).join(", ") || "—"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => togglePublished(a)} style={{
                  ...btnRowAction,
                  color: a.published ? "#22c55e" : "#475569",
                  borderColor: a.published ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)",
                }}>
                  {a.published ? "Opub." : "Ukryty"}
                </button>
                <button onClick={() => openEdit(a.id)} style={btnRowAction}>Edytuj</button>
                <button onClick={() => handleDelete(a)} style={{ ...btnRowAction, color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" }}>Usuń</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`* { box-sizing: border-box; }`}</style>
    </div>
  );
}

const card = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "20px" };
const lbl = { display: "block", fontSize: 10, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 6 };
const inp = { width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#fff", fontSize: 13 };
const btnPrimary = { padding: "9px 18px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnGhost = { padding: "9px 14px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#64748b", fontSize: 13, cursor: "pointer" };
const btnRowAction = { padding: "4px 10px", background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#64748b", fontSize: 11, cursor: "pointer" };
const alertErr = { fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "9px 13px" };
const alertOk = { fontSize: 13, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 7, padding: "9px 13px" };
