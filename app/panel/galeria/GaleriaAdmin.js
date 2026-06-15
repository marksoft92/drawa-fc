"use client";

import { useState, useEffect, useRef } from "react";

const emptyForm = () => ({
  tytul: "", slug: "", date: new Date().toISOString().slice(0, 10),
  tags: "", thumbnail: "", author: "", hrefAuthor: "",
  photos: [], kolejnosc: 0, published: true,
});

function slugify(str) {
  return str.toLowerCase()
    .replace(/ą/g,"a").replace(/ć/g,"c").replace(/ę/g,"e").replace(/ł/g,"l")
    .replace(/ń/g,"n").replace(/ó/g,"o").replace(/ś/g,"s").replace(/ź/g,"z").replace(/ż/g,"z")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}

async function uploadPhoto(file, onError) {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch("/api/admin/galeria/upload", { method: "POST", body: fd });
  const d = await r.json();
  if (!r.ok) { onError(d.error || "Błąd uploadu"); return null; }
  return d.url;
}

function ThumbnailField({ value, onChange, onError }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);
  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    const url = await uploadPhoto(file, onError);
    if (url) onChange(url);
    setUploading(false);
  }
  return (
    <div>
      <label style={lbl}>MINIATURKA ALBUMU</label>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 96, height: 64, flexShrink: 0, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {value
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ opacity: 0.2, fontSize: 22 }}>🖼️</span>
          }
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files?.[0])} />
            <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
              style={{ ...btnGhost, fontSize: 12, padding: "7px 14px", opacity: uploading ? 0.6 : 1 }}>
              {uploading ? "Wgrywam..." : value ? "Zmień" : "Wgraj"}
            </button>
            {value && <button type="button" onClick={() => onChange("")} style={{ ...btnGhost, fontSize: 12, color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" }}>Usuń</button>}
          </div>
          <input style={{ ...inp, fontSize: 12 }} value={value} onChange={e => onChange(e.target.value)} placeholder="lub wklej URL / ścieżkę" />
        </div>
      </div>
    </div>
  );
}

function PhotosGrid({ photos, onChange, onError }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleFiles(files) {
    if (!files?.length) return;
    setUploading(true);
    setProgress(0);
    const arr = [...files];
    const newPhotos = [];
    for (let i = 0; i < arr.length; i++) {
      const url = await uploadPhoto(arr[i], onError);
      if (url) newPhotos.push({ src: url, caption: "" });
      setProgress(Math.round(((i + 1) / arr.length) * 100));
    }
    onChange(prev => [...prev, ...newPhotos]);
    setUploading(false);
    setProgress(0);
  }

  function remove(i) { onChange(prev => prev.filter((_, j) => j !== i)); }
  function move(i, dir) {
    onChange(prev => {
      const arr = [...prev];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return prev;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  }
  function setCaption(i, v) {
    onChange(prev => { const arr = [...prev]; arr[i] = { ...arr[i], caption: v }; return arr; });
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <label style={{ ...lbl, marginBottom: 0 }}>ZDJĘCIA ({photos.length})</label>
          <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>Pierwsze zdjęcie = główne w lightboxie</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input ref={ref} type="file" accept="image/*" multiple style={{ display: "none" }}
            onChange={e => handleFiles(e.target.files)} />
          <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
            style={{ ...btnGhost, fontSize: 12, padding: "6px 14px", opacity: uploading ? 0.6 : 1 }}>
            {uploading ? `Wgrywam... ${progress}%` : "+ Dodaj zdjęcia"}
          </button>
        </div>
      </div>

      {photos.length === 0 ? (
        <div
          onClick={() => ref.current?.click()}
          style={{ border: "2px dashed rgba(255,255,255,0.08)", borderRadius: 10, padding: "40px 20px", textAlign: "center", cursor: "pointer", color: "#334155", fontSize: 13 }}
        >
          Kliknij lub przeciągnij zdjęcia tutaj
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
          {photos.map((p, i) => (
            <div key={i} style={{ position: "relative", borderRadius: 8, overflow: "hidden", background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", aspectRatio: "4/3" }}>
              {p.src
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={p.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#334155" }}>⚽</div>
              }
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", opacity: 0, transition: "opacity 0.2s", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 6 }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 10, color: "#64748b", background: "rgba(0,0,0,0.5)", padding: "2px 6px", borderRadius: 4 }}>#{i + 1}</span>
                  <button type="button" onClick={() => remove(i)} style={{ background: "rgba(239,68,68,0.8)", border: "none", borderRadius: 4, color: "#fff", fontSize: 11, cursor: "pointer", padding: "2px 6px" }}>✕</button>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} style={{ flex: 1, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 4, color: "#fff", fontSize: 13, cursor: "pointer", opacity: i === 0 ? 0.3 : 1 }}>←</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === photos.length - 1} style={{ flex: 1, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 4, color: "#fff", fontSize: 13, cursor: "pointer", opacity: i === photos.length - 1 ? 0.3 : 1 }}>→</button>
                </div>
              </div>
              {i === 0 && <div style={{ position: "absolute", top: 4, left: 4, fontSize: 9, background: "#3b82f6", color: "#fff", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>OKŁADKA</div>}
            </div>
          ))}
        </div>
      )}
      {photos.length > 0 && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          {photos.slice(0, 3).map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#334155", width: 24, textAlign: "right" }}>#{i+1}</span>
              <input style={{ ...inp, fontSize: 11, padding: "5px 10px", flex: 1 }} value={p.caption} onChange={e => setCaption(i, e.target.value)} placeholder="Podpis zdjęcia (opcjonalnie)" />
            </div>
          ))}
          {photos.length > 3 && <div style={{ fontSize: 11, color: "#334155" }}>... i {photos.length - 3} więcej. Podpisy możesz edytować po zapisaniu.</div>}
        </div>
      )}
    </div>
  );
}

export default function GaleriaAdmin() {
  const [albumy, setAlumy] = useState([]);
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
    fetch("/api/admin/galeria")
      .then(r => r.json())
      .then(d => { if (!cancelled) setAlumy(Array.isArray(d) ? d : []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tick]);

  async function openEdit(id) {
    setError(""); setSuccess("");
    const r = await fetch(`/api/admin/galeria/${id}`);
    const d = await r.json();
    setEditId(id);
    setForm({
      tytul: d.tytul, slug: d.slug, date: d.date,
      tags: (d.tags || []).join(", "),
      thumbnail: d.thumbnail || "", author: d.author || "", hrefAuthor: d.hrefAuthor || "",
      photos: Array.isArray(d.photos) ? d.photos : [],
      kolejnosc: d.kolejnosc, published: d.published,
    });
    setView("form");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSaving(true);
    const payload = {
      ...form,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      photos: form.photos,
      kolejnosc: Number(form.kolejnosc) || 0,
    };
    try {
      const url = editId ? `/api/admin/galeria/${editId}` : "/api/admin/galeria";
      const r = await fetch(url, { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Błąd"); setSaving(false); return; }
      setSuccess(editId ? "Zapisano" : "Album dodany");
      setTick(t => t + 1); setView("list");
    } catch { setError("Błąd połączenia"); }
    finally { setSaving(false); }
  }

  async function togglePublished(a) {
    await fetch(`/api/admin/galeria/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published: !a.published }) });
    setTick(t => t + 1);
  }

  async function handleDelete(a) {
    if (!confirm(`Usunąć album "${a.tytul}"? Zdjęcia w folderze nie zostaną usunięte.`)) return;
    await fetch(`/api/admin/galeria/${a.id}`, { method: "DELETE" });
    setTick(t => t + 1);
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  if (view === "form") return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <button onClick={() => setView("list")} style={btnGhost}>← Wróć</button>
        <div style={{ fontSize: "clamp(18px,4vw,26px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>
          {editId ? "Edytuj album" : "Nowy album"}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={card}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>TYTUŁ *</label>
              <input style={inp} value={form.tytul} onChange={e => {
                const tytul = e.target.value;
                setForm(p => ({ ...p, tytul, slug: editId ? p.slug : slugify(tytul) }));
              }} required placeholder="Tytuł albumu" />
            </div>
            <div>
              <label style={lbl}>SLUG *</label>
              <input style={inp} value={form.slug} onChange={f("slug")} required placeholder="url-albumu" />
            </div>
            <div>
              <label style={lbl}>DATA</label>
              <input style={inp} type="date" value={form.date} onChange={f("date")} />
            </div>
            <div>
              <label style={lbl}>TAGI (przecinkami)</label>
              <input style={inp} value={form.tags} onChange={f("tags")} placeholder="Wygrana, Liga, Wyjazd" />
            </div>
            <div>
              <label style={lbl}>KOLEJNOŚĆ</label>
              <input style={inp} type="number" value={form.kolejnosc} onChange={f("kolejnosc")} min={0} />
            </div>
            <div>
              <label style={lbl}>AUTOR ZDJĘĆ</label>
              <input style={inp} value={form.author} onChange={f("author")} placeholder="Imię Nazwisko" />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>LINK DO PROFILU AUTORA</label>
              <input style={inp} value={form.hrefAuthor} onChange={f("hrefAuthor")} placeholder="https://www.facebook.com/..." />
            </div>
          </div>
        </div>

        <div style={card}>
          <ThumbnailField value={form.thumbnail} onChange={v => setForm(p => ({ ...p, thumbnail: v }))} onError={setError} />
        </div>

        <div style={card}>
          <PhotosGrid
            photos={form.photos}
            onChange={updater => setForm(p => ({
              ...p,
              photos: typeof updater === "function" ? updater(p.photos) : updater
            }))}
            onError={setError}
          />
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "#94a3b8" }}>
          <input type="checkbox" checked={form.published} onChange={e => setForm(p => ({ ...p, published: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "#3b82f6" }} />
          Opublikowany (widoczny na stronie)
        </label>

        {error && <div style={alertErr}>{error}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={saving} style={btnPrimary}>{saving ? "Zapisuję..." : editId ? "Zapisz" : "Utwórz album"}</button>
          <button type="button" onClick={() => setView("list")} style={btnGhost}>Anuluj</button>
        </div>
      </form>
      <style>{`input:focus,textarea:focus{outline:none;border-color:rgba(59,130,246,0.5)!important}*{box-sizing:border-box}`}</style>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: "clamp(20px,4vw,28px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>Galeria</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{albumy.length} albumów</div>
        </div>
        <button onClick={() => { setEditId(null); setForm(emptyForm()); setError(""); setSuccess(""); setView("form"); }} style={btnPrimary}>+ Nowy album</button>
      </div>

      {success && <div style={{ ...alertOk, marginBottom: 16 }}>{success}</div>}

      {loading ? (
        <div style={{ color: "#475569", fontSize: 13 }}>Ładowanie...</div>
      ) : albumy.length === 0 ? (
        <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: 20 }}>Brak albumów.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {albumy.map(a => (
            <div key={a.id} style={{ ...card, display: "flex", alignItems: "center", gap: 12, padding: "10px 14px" }}>
              <div style={{ width: 72, height: 48, flexShrink: 0, borderRadius: 6, overflow: "hidden", background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {a.thumbnail
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={a.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ opacity: 0.2 }}>🖼️</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: a.published ? "#fff" : "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.tytul}</div>
                <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>
                  {a.date} · {Array.isArray(a.photos) ? a.photos.length : 0} zdjęć · {(a.tags || []).join(", ") || "—"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
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
