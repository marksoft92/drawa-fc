"use client";

import { useState, useEffect, useRef } from "react";

const emptyForm = () => ({
  title: "", slug: "", excerpt: "", content: "",
  thumbnail: "", kolor: "#3b82f6",
  tags: "", date: new Date().toISOString().slice(0, 10),
  photos: [], published: true,
});

function slugify(str) {
  return str.toLowerCase()
    .replace(/ą/g,"a").replace(/ć/g,"c").replace(/ę/g,"e").replace(/ł/g,"l")
    .replace(/ń/g,"n").replace(/ó/g,"o").replace(/ś/g,"s").replace(/ź/g,"z").replace(/ż/g,"z")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}

// ─── Upload helper ───────────────────────────────────────────
async function uploadFile(file, onError) {
  try {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/admin/artykuly/upload", { method: "POST", body: fd });
    if (r.status === 413) { onError("Plik za duży (max 10 MB)"); return null; }
    const d = await r.json();
    if (!r.ok) { onError(d.error || "Błąd uploadu"); return null; }
    return d.url;
  } catch {
    onError("Błąd połączenia podczas wgrywania");
    return null;
  }
}

// ─── Pole z uploadem zdjęcia ─────────────────────────────────
function ImageUploadField({ value, onChange, label, onError }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, onError);
      if (url) onChange(url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {label && <label style={lbl}>{label}</label>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {value && (
          <div style={{ position: "relative", display: "inline-block" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" style={{ maxHeight: 120, maxWidth: "100%", borderRadius: 6, objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} />
            <button
              type="button"
              onClick={() => onChange("")}
              style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", fontSize: 12, cursor: "pointer", lineHeight: 1 }}
            >✕</button>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            ref={ref}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={e => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={uploading}
            style={{ ...btnGhost, fontSize: 12, padding: "7px 14px", opacity: uploading ? 0.6 : 1 }}
          >
            {uploading ? "Wgrywam..." : value ? "Zmień zdjęcie" : "Wgraj zdjęcie"}
          </button>
          {!value && (
            <input
              style={{ ...inp, flex: 1, fontSize: 12 }}
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="lub wklej URL / ścieżkę"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Wiersz zdjęcia w galerii ────────────────────────────────
function PhotoRow({ photo, onChange, onRemove, onError, onMoveUp, onMoveDown, isFirst, isLast }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, onError);
      if (url) onChange("src", url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {/* Podgląd */}
        <div style={{ width: 80, height: 60, flexShrink: 0, borderRadius: 6, overflow: "hidden", background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {photo.src
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={photo.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 20, opacity: 0.2 }}>⚽</span>
          }
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files?.[0])} />
            <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
              style={{ ...btnGhost, fontSize: 11, padding: "5px 10px", opacity: uploading ? 0.6 : 1 }}>
              {uploading ? "Wgrywam..." : photo.src ? "Zmień" : "Wgraj"}
            </button>
            {!photo.src && (
              <input style={{ ...inp, flex: 1, fontSize: 12, padding: "6px 10px" }}
                value={photo.src} onChange={e => onChange("src", e.target.value)}
                placeholder="lub wklej URL / ścieżkę" />
            )}
            {photo.src && (
              <span style={{ fontSize: 11, color: "#334155", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{photo.src}</span>
            )}
          </div>
          <input style={{ ...inp, fontSize: 12, padding: "5px 10px" }}
            value={photo.caption} onChange={e => onChange("caption", e.target.value)}
            placeholder="Podpis zdjęcia (opcjonalnie)" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          <button type="button" onClick={onMoveUp} disabled={isFirst} style={{ ...btnGhost, padding: "4px 8px", opacity: isFirst ? 0.3 : 1, fontSize: 12 }}>↑</button>
          <button type="button" onClick={onMoveDown} disabled={isLast} style={{ ...btnGhost, padding: "4px 8px", opacity: isLast ? 0.3 : 1, fontSize: 12 }}>↓</button>
          <button type="button" onClick={onRemove} style={{ ...btnGhost, padding: "4px 8px", color: "#ef4444", borderColor: "rgba(239,68,68,0.2)", fontSize: 12 }}>✕</button>
        </div>
      </div>
    </div>
  );
}

// ─── Główny komponent ────────────────────────────────────────
export default function AktualnosciAdmin() {
  const [artykuly, setArtykuly] = useState([]);
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
    fetch("/api/admin/artykuly")
      .then(r => r.json())
      .then(d => { if (!cancelled) setArtykuly(Array.isArray(d) ? d : []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tick]);

  function openCreate() {
    setEditId(null); setForm(emptyForm());
    setError(""); setSuccess(""); setView("form");
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
      photos: Array.isArray(d.photos) ? d.photos : [],
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
      photos: form.photos.filter(p => p.src?.trim()),
      thumbnail: form.thumbnail?.trim() || null,
      kolor: form.kolor?.trim() || null,
    };
    try {
      const url = editId ? `/api/admin/artykuly/${editId}` : "/api/admin/artykuly";
      const r = await fetch(url, { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Błąd"); setSaving(false); return; }
      setSuccess(editId ? "Zapisano zmiany" : "Artykuł opublikowany");
      setTick(t => t + 1); setView("list");
    } catch { setError("Błąd połączenia"); }
    finally { setSaving(false); }
  }

  async function togglePublished(a) {
    await fetch(`/api/admin/artykuly/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published: !a.published }) });
    setTick(t => t + 1);
  }

  async function handleDelete(a) {
    if (!confirm(`Usunąć "${a.title}"?`)) return;
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
  const movePhoto = (i, dir) => setForm(p => {
    const photos = [...p.photos];
    const j = i + dir;
    if (j < 0 || j >= photos.length) return p;
    [photos[i], photos[j]] = [photos[j], photos[i]];
    return { ...p, photos };
  });

  if (view === "form") return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <button onClick={() => setView("list")} style={btnGhost}>← Wróć</button>
        <div style={{ fontSize: "clamp(18px,4vw,26px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>
          {editId ? "Edytuj artykuł" : "Nowy artykuł"}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Podstawowe dane */}
        <div style={card}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>TYTUŁ *</label>
              <input style={inp} value={form.title} onChange={e => {
                const title = e.target.value;
                setForm(p => ({ ...p, title, slug: editId ? p.slug : slugify(title) }));
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
              <label style={lbl}>KOLOR AKCENTU</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="color" value={form.kolor} onChange={f("kolor")} style={{ width: 38, height: 36, border: "none", background: "none", cursor: "pointer", padding: 0 }} />
                <input style={{ ...inp, flex: 1 }} value={form.kolor} onChange={f("kolor")} placeholder="#3b82f6" />
              </div>
            </div>
            <div>
              <label style={lbl}>TAGI (oddziel przecinkami)</label>
              <input style={inp} value={form.tags} onChange={f("tags")} placeholder="wynik, liga, puchar" />
            </div>
          </div>
        </div>

        {/* Miniaturka */}
        <div style={card}>
          <ImageUploadField
            label="MINIATURKA (widoczna na liście artykułów)"
            value={form.thumbnail}
            onChange={v => setForm(p => ({ ...p, thumbnail: v }))}
            onError={setError}
          />
        </div>

        {/* Zajawka */}
        <div style={card}>
          <label style={lbl}>ZAJAWKA</label>
          <textarea style={{ ...inp, height: 72, resize: "vertical" }} value={form.excerpt} onChange={f("excerpt")} placeholder="Krótki opis widoczny na liście..." />
        </div>

        {/* Treść */}
        <div style={card}>
          <label style={lbl}>TREŚĆ (akapity oddziel pustą linią)</label>
          <textarea style={{ ...inp, height: 300, resize: "vertical", fontFamily: "monospace", fontSize: 13, lineHeight: 1.6 }} value={form.content} onChange={f("content")} placeholder="Treść artykułu..." />
        </div>

        {/* Zdjęcia galerii */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <label style={{ ...lbl, marginBottom: 0 }}>ZDJĘCIA</label>
              <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>Pierwsze zdjęcie wyświetla się jako główne nad treścią</div>
            </div>
            <button type="button" onClick={addPhoto} style={{ ...btnGhost, fontSize: 12, padding: "6px 12px" }}>+ Dodaj zdjęcie</button>
          </div>
          {form.photos.length === 0 ? (
            <div style={{ fontSize: 13, color: "#334155", textAlign: "center", padding: "20px 0" }}>Brak zdjęć — kliknij &quot;+ Dodaj zdjęcie&quot;</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {form.photos.map((p, i) => (
                <PhotoRow
                  key={i}
                  photo={p}
                  onChange={(k, v) => setPhoto(i, k, v)}
                  onRemove={() => removePhoto(i)}
                  onError={setError}
                  onMoveUp={() => movePhoto(i, -1)}
                  onMoveDown={() => movePhoto(i, 1)}
                  isFirst={i === 0}
                  isLast={i === form.photos.length - 1}
                />
              ))}
            </div>
          )}
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "#94a3b8" }}>
          <input type="checkbox" checked={form.published} onChange={e => setForm(p => ({ ...p, published: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "#3b82f6" }} />
          Opublikowany (widoczny na stronie)
        </label>

        {error && <div style={alertErr}>{error}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={saving} style={btnPrimary}>{saving ? "Zapisuję..." : editId ? "Zapisz zmiany" : "Opublikuj artykuł"}</button>
          <button type="button" onClick={() => setView("list")} style={btnGhost}>Anuluj</button>
        </div>
      </form>

      <style>{`
        input:focus, textarea:focus { outline: none; border-color: rgba(59,130,246,0.5) !important; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.4); }
        input[type=color] { padding: 0; }
      `}</style>
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
              {a.thumbnail
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={a.thumbnail} alt="" style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
                : <div style={{ width: 48, height: 36, background: "rgba(59,130,246,0.08)", borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚽</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: a.published ? "#fff" : "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {a.title}
                </div>
                <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>
                  {a.date} · {(a.tags || []).join(", ") || "—"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => togglePublished(a)} style={{ ...btnRowAction, color: a.published ? "#22c55e" : "#475569", borderColor: a.published ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)" }}>
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
