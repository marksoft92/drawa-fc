"use client";

import { useState, useEffect, useRef } from "react";

const card = { background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 20px" };
const inp = { width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#fff", fontSize: 13 };
const lbl = { display: "block", fontSize: 10, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 6 };
const btnPrimary = { padding: "9px 18px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnGhost = { padding: "9px 14px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#64748b", fontSize: 13, cursor: "pointer" };
const btnRow = { padding: "4px 10px", background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#64748b", fontSize: 11, cursor: "pointer" };
const alertErr = { fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "9px 13px" };
const alertOk = { fontSize: 13, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 7, padding: "9px 13px" };

function slugify(str) {
  return str.toLowerCase()
    .replace(/ą/g, "a").replace(/ć/g, "c").replace(/ę/g, "e").replace(/ł/g, "l")
    .replace(/ń/g, "n").replace(/ó/g, "o").replace(/ś/g, "s").replace(/ź/g, "z").replace(/ż/g, "z")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function fmtPLN(grosze) {
  return (grosze / 100).toFixed(2) + " zł";
}

function totalStock(p) {
  const w = Array.isArray(p.warianty) ? p.warianty : [];
  if (w.length > 0) return w.reduce((s, v) => s + (v.stan || 0), 0);
  return p.stan || 0;
}

const STATUS_MAP = {
  nowe: { label: "Nowe", bg: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "rgba(251,191,36,0.3)" },
  potwierdzone: { label: "Potwierdzone", bg: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "rgba(59,130,246,0.3)" },
  "wysłane": { label: "Wysłane", bg: "rgba(168,85,247,0.12)", color: "#a855f7", border: "rgba(168,85,247,0.3)" },
  "zakończone": { label: "Zakończone", bg: "rgba(34,197,94,0.12)", color: "#22c55e", border: "rgba(34,197,94,0.3)" },
  anulowane: { label: "Anulowane", bg: "rgba(100,116,139,0.12)", color: "#64748b", border: "rgba(100,116,139,0.3)" },
};

// ━━━ MAIN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function SklepAdmin() {
  const [tab, setTab] = useState("produkty");

  const tabBtn = (key, label) => ({
    padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
    background: tab === key ? "rgba(59,130,246,0.15)" : "transparent",
    color: tab === key ? "#3b82f6" : "#64748b",
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: "clamp(20px,4vw,28px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>Sklep</div>
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 3, border: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={() => setTab("produkty")} style={tabBtn("produkty", "Produkty")}>Produkty</button>
          <button onClick={() => setTab("kategorie")} style={tabBtn("kategorie", "Kategorie")}>Kategorie</button>
          <button onClick={() => setTab("zamowienia")} style={tabBtn("zamowienia", "Zamówienia")}>Zamówienia</button>
        </div>
      </div>
      {tab === "produkty" && <ProduktyTab />}
      {tab === "kategorie" && <KategorieTab />}
      {tab === "zamowienia" && <ZamowieniaTab />}
      <style>{`input:focus,textarea:focus,select:focus{outline:none;border-color:rgba(59,130,246,0.5)!important}select option{background:#0f172a}input::placeholder{color:#334155}`}</style>
    </div>
  );
}

// ━━━ PRODUKTY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ProduktyTab() {
  const [produkty, setProdukty] = useState([]);
  const [kategorie, setKategorie] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyProduct());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tick, setTick] = useState(0);
  const fileRef = useRef();

  function emptyProduct() {
    return { nazwa: "", slug: "", opis: "", cena: "", zdjecia: [], kategoriaId: "", warianty: [], stan: 0, hasWarianty: false, published: false, kolejnosc: 0 };
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/sklep/produkty").then(r => r.json()),
      fetch("/api/admin/sklep/kategorie").then(r => r.json()),
    ]).then(([p, k]) => {
      setProdukty(Array.isArray(p) ? p : []);
      setKategorie(Array.isArray(k) ? k : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [tick]);

  function openCreate() {
    setEditId(null); setForm(emptyProduct()); setError(""); setSuccess(""); setView("form");
  }
  function openEdit(p) {
    const w = Array.isArray(p.warianty) ? p.warianty : [];
    setEditId(p.id);
    setForm({
      nazwa: p.nazwa, slug: p.slug, opis: p.opis || "", cena: (p.cena / 100).toFixed(2),
      zdjecia: Array.isArray(p.zdjecia) ? p.zdjecia : [], kategoriaId: p.kategoriaId || "",
      warianty: w, stan: p.stan || 0, hasWarianty: w.length > 0, published: p.published, kolejnosc: p.kolejnosc,
    });
    setError(""); setSuccess(""); setView("form");
  }

  async function uploadImage() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/admin/sklep/produkty/upload", { method: "POST", body: fd });
    const d = await r.json();
    if (r.ok) setForm(p => ({ ...p, zdjecia: [...p.zdjecia, { src: d.url }] }));
    else setError(d.error || "Błąd uploadu");
    fileRef.current.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError(""); setSaving(true);
    const payload = {
      ...form, cena: Math.round(parseFloat(form.cena || 0) * 100),
      warianty: form.hasWarianty ? form.warianty.filter(v => v.nazwa?.trim()) : [],
      stan: form.hasWarianty ? 0 : Number(form.stan) || 0,
    };
    delete payload.hasWarianty;
    try {
      const url = editId ? `/api/admin/sklep/produkty/${editId}` : "/api/admin/sklep/produkty";
      const r = await fetch(url, { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Błąd"); setSaving(false); return; }
      setSuccess(editId ? "Zapisano" : "Dodano produkt"); setTick(t => t + 1); setView("list");
    } catch { setError("Błąd połączenia"); }
    finally { setSaving(false); }
  }

  async function togglePublished(p) {
    await fetch(`/api/admin/sklep/produkty/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published: !p.published }) });
    setTick(t => t + 1);
  }
  async function handleDelete(p) {
    if (!confirm(`Usunąć "${p.nazwa}"?`)) return;
    const r = await fetch(`/api/admin/sklep/produkty/${p.id}`, { method: "DELETE" });
    if (!r.ok) { const d = await r.json(); alert(d.error || "Błąd"); return; }
    setTick(t => t + 1);
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  if (view === "form") return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <button onClick={() => setView("list")} style={btnGhost}>← Wróć</button>
        <div style={{ fontSize: 18, fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>{editId ? "Edytuj produkt" : "Nowy produkt"}</div>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={card}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>NAZWA *</label>
              <input style={inp} value={form.nazwa} onChange={e => { const v = e.target.value; setForm(p => ({ ...p, nazwa: v, slug: editId ? p.slug : slugify(v) })); }} required placeholder="Szalik klubowy" />
            </div>
            <div>
              <label style={lbl}>SLUG *</label>
              <input style={inp} value={form.slug} onChange={f("slug")} required placeholder="szalik-klubowy" />
            </div>
            <div>
              <label style={lbl}>CENA (PLN) *</label>
              <input style={inp} type="number" step="0.01" min="0" value={form.cena} onChange={f("cena")} required placeholder="25.00" />
            </div>
            <div>
              <label style={lbl}>KATEGORIA</label>
              <select style={{ ...inp, cursor: "pointer" }} value={form.kategoriaId} onChange={f("kategoriaId")}>
                <option value="">— brak —</option>
                {kategorie.map(k => <option key={k.id} value={k.id}>{k.nazwa}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>KOLEJNOŚĆ</label>
              <input style={inp} type="number" value={form.kolejnosc} onChange={e => setForm(p => ({ ...p, kolejnosc: Number(e.target.value) }))} />
            </div>
          </div>
        </div>

        <div style={card}>
          <label style={lbl}>OPIS</label>
          <textarea style={{ ...inp, minHeight: 80, resize: "vertical" }} value={form.opis} onChange={f("opis")} placeholder="Opis produktu..." />
        </div>

        <div style={card}>
          <label style={lbl}>ZDJĘCIA</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {form.zdjecia.map((z, i) => (
              <div key={i} style={{ position: "relative", width: 80, height: 80, borderRadius: 6, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={z.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button type="button" onClick={() => setForm(p => ({ ...p, zdjecia: p.zdjecia.filter((_, j) => j !== i) }))}
                  style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", fontSize: 10, cursor: "pointer", lineHeight: 1 }}>✕</button>
              </div>
            ))}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={uploadImage} />
          <button type="button" onClick={() => fileRef.current?.click()} style={{ ...btnGhost, fontSize: 12 }}>+ Dodaj zdjęcie</button>
        </div>

        <div style={card}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "#94a3b8", marginBottom: 12 }}>
            <input type="checkbox" checked={form.hasWarianty} onChange={e => setForm(p => ({ ...p, hasWarianty: e.target.checked, warianty: e.target.checked ? (p.warianty.length ? p.warianty : [{ nazwa: "", stan: 0 }]) : [] }))} style={{ width: 16, height: 16, accentColor: "#3b82f6" }} />
            Produkt z wariantami (rozmiary)
          </label>
          {form.hasWarianty ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {form.warianty.map((w, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input style={{ ...inp, flex: 1 }} value={w.nazwa} onChange={e => { const v = [...form.warianty]; v[i] = { ...v[i], nazwa: e.target.value }; setForm(p => ({ ...p, warianty: v })); }} placeholder="np. M, L, XL" />
                  <input style={{ ...inp, width: 80 }} type="number" min="0" value={w.stan} onChange={e => { const v = [...form.warianty]; v[i] = { ...v[i], stan: Number(e.target.value) }; setForm(p => ({ ...p, warianty: v })); }} placeholder="Stan" />
                  <button type="button" onClick={() => setForm(p => ({ ...p, warianty: p.warianty.filter((_, j) => j !== i) }))} style={{ ...btnRow, color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" }}>✕</button>
                </div>
              ))}
              <button type="button" onClick={() => setForm(p => ({ ...p, warianty: [...p.warianty, { nazwa: "", stan: 0 }] }))} style={{ ...btnGhost, fontSize: 12, alignSelf: "flex-start" }}>+ Dodaj wariant</button>
            </div>
          ) : (
            <div>
              <label style={lbl}>STAN MAGAZYNOWY</label>
              <input style={{ ...inp, width: 120 }} type="number" min="0" value={form.stan} onChange={e => setForm(p => ({ ...p, stan: Number(e.target.value) }))} />
            </div>
          )}
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "#94a3b8" }}>
          <input type="checkbox" checked={form.published} onChange={e => setForm(p => ({ ...p, published: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "#3b82f6" }} />
          Opublikowany (widoczny w sklepie)
        </label>

        {error && <div style={alertErr}>{error}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={saving} style={btnPrimary}>{saving ? "Zapisuję..." : editId ? "Zapisz" : "Dodaj produkt"}</button>
          <button type="button" onClick={() => setView("list")} style={btnGhost}>Anuluj</button>
        </div>
      </form>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#475569" }}>{produkty.length} produktów</div>
        <button onClick={openCreate} style={btnPrimary}>+ Nowy produkt</button>
      </div>
      {success && <div style={{ ...alertOk, marginBottom: 12 }}>{success}</div>}
      {loading ? <div style={{ color: "#475569", fontSize: 13 }}>Ładowanie...</div> : produkty.length === 0 ? (
        <div style={{ color: "#475569", fontSize: 13, padding: 20, textAlign: "center" }}>Brak produktów.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {produkty.map(p => {
            const imgs = Array.isArray(p.zdjecia) ? p.zdjecia : [];
            return (
              <div key={p.id} style={{ ...card, display: "flex", alignItems: "center", gap: 12, padding: "10px 14px" }}>
                {imgs[0]
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={imgs[0].src} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                  : <div style={{ width: 48, height: 48, background: "rgba(59,130,246,0.08)", borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛍</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: p.published ? "#fff" : "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nazwa}</div>
                  <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>
                    {fmtPLN(p.cena)} · {p.kategoria?.nazwa || "—"} · Stan: {totalStock(p)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => togglePublished(p)} style={{ ...btnRow, color: p.published ? "#22c55e" : "#475569" }}>{p.published ? "ON" : "OFF"}</button>
                  <button onClick={() => openEdit(p)} style={btnRow}>Edytuj</button>
                  <button onClick={() => handleDelete(p)} style={{ ...btnRow, color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" }}>Usuń</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ━━━ KATEGORIE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function KategorieTab() {
  const [kategorie, setKategorie] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nazwa: "", slug: "", kolejnosc: 0 });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    fetch("/api/admin/sklep/kategorie").then(r => r.json()).then(d => setKategorie(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, [tick]);

  async function handleSubmit(e) {
    e.preventDefault(); setError(""); setSaving(true);
    const url = editId ? `/api/admin/sklep/kategorie/${editId}` : "/api/admin/sklep/kategorie";
    try {
      const r = await fetch(url, { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Błąd"); setSaving(false); return; }
      setForm({ nazwa: "", slug: "", kolejnosc: 0 }); setEditId(null); setTick(t => t + 1);
    } catch { setError("Błąd"); }
    finally { setSaving(false); }
  }

  function openEdit(k) {
    setEditId(k.id); setForm({ nazwa: k.nazwa, slug: k.slug, kolejnosc: k.kolejnosc }); setError("");
  }

  async function handleDelete(k) {
    if (!confirm(`Usunąć "${k.nazwa}"?`)) return;
    const r = await fetch(`/api/admin/sklep/kategorie/${k.id}`, { method: "DELETE" });
    if (!r.ok) { const d = await r.json(); alert(d.error || "Błąd"); return; }
    setTick(t => t + 1);
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <form onSubmit={handleSubmit} style={{ ...card, display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={lbl}>NAZWA</label>
          <input style={inp} value={form.nazwa} onChange={e => setForm(p => ({ ...p, nazwa: e.target.value, slug: editId ? p.slug : slugify(e.target.value) }))} required placeholder="Odzież" />
        </div>
        <div style={{ width: 140 }}>
          <label style={lbl}>SLUG</label>
          <input style={inp} value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} required placeholder="odziez" />
        </div>
        <div style={{ width: 80 }}>
          <label style={lbl}>KOLEJNOŚĆ</label>
          <input style={inp} type="number" value={form.kolejnosc} onChange={e => setForm(p => ({ ...p, kolejnosc: Number(e.target.value) }))} />
        </div>
        <button type="submit" disabled={saving} style={{ ...btnPrimary, whiteSpace: "nowrap" }}>{editId ? "Zapisz" : "+ Dodaj"}</button>
        {editId && <button type="button" onClick={() => { setEditId(null); setForm({ nazwa: "", slug: "", kolejnosc: 0 }); }} style={btnGhost}>Anuluj</button>}
      </form>
      {error && <div style={{ ...alertErr, marginBottom: 12 }}>{error}</div>}
      {loading ? <div style={{ color: "#475569", fontSize: 13 }}>Ładowanie...</div> : kategorie.length === 0 ? (
        <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: 20 }}>Brak kategorii.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {kategorie.map(k => (
            <div key={k.id} style={{ ...card, display: "flex", alignItems: "center", gap: 12, padding: "10px 14px" }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{k.nazwa}</span>
                <span style={{ fontSize: 11, color: "#334155", marginLeft: 8 }}>/{k.slug} · {k._count?.produkty || 0} prod.</span>
              </div>
              <button onClick={() => openEdit(k)} style={btnRow}>Edytuj</button>
              <button onClick={() => handleDelete(k)} style={{ ...btnRow, color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" }}>Usuń</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ━━━ ZAMÓWIENIA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ZamowieniaTab() {
  const [zamowienia, setZamowienia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const qs = filter ? `?status=${filter}` : "";
    fetch(`/api/admin/sklep/zamowienia${qs}`).then(r => r.json()).then(d => setZamowienia(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, [tick, filter]);

  async function toggleExpand(z) {
    if (expandedId === z.id) { setExpandedId(null); setDetail(null); return; }
    setExpandedId(z.id);
    const r = await fetch(`/api/admin/sklep/zamowienia/${z.id}`);
    if (r.ok) setDetail(await r.json());
  }

  async function changeStatus(id, status) {
    await fetch(`/api/admin/sklep/zamowienia/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setTick(t => t + 1);
    if (detail?.id === id) setDetail(d => ({ ...d, status }));
  }

  const FILTERS = [
    { value: "", label: "Wszystkie" },
    { value: "nowe", label: "Nowe" },
    { value: "potwierdzone", label: "Potwierdzone" },
    { value: "wysłane", label: "Wysłane" },
    { value: "zakończone", label: "Zakończone" },
    { value: "anulowane", label: "Anulowane" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
        {FILTERS.map(fl => (
          <button key={fl.value} onClick={() => { setFilter(fl.value); setLoading(true); }}
            style={{ padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500,
              background: filter === fl.value ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.03)",
              color: filter === fl.value ? "#3b82f6" : "#64748b" }}>
            {fl.label}
          </button>
        ))}
      </div>
      {loading ? <div style={{ color: "#475569", fontSize: 13 }}>Ładowanie...</div> : zamowienia.length === 0 ? (
        <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: 20 }}>Brak zamówień.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {zamowienia.map(z => {
            const st = STATUS_MAP[z.status] || STATUS_MAP.nowe;
            return (
              <div key={z.id}>
                <div onClick={() => toggleExpand(z)} style={{ ...card, padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, borderRadius: expandedId === z.id ? "12px 12px 0 0" : 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "monospace" }}>{z.numer}</span>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: st.bg, color: st.color, border: `1px solid ${st.border}`, fontWeight: 600 }}>{st.label}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>
                      {z.imie} · {fmtPLN(z.kwota)} · {z._count?.pozycje || 0} poz. · {new Date(z.createdAt).toLocaleString("pl-PL")}
                    </div>
                  </div>
                  <span style={{ color: "#334155", fontSize: 14 }}>{expandedId === z.id ? "▲" : "▼"}</span>
                </div>
                {expandedId === z.id && detail && (
                  <div style={{ background: "rgba(59,130,246,0.03)", border: "1px solid rgba(59,130,246,0.1)", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "14px 16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>
                      <div><strong>Email:</strong> {detail.email}</div>
                      <div><strong>Telefon:</strong> {detail.telefon}</div>
                      <div style={{ gridColumn: "1/-1" }}><strong>Adres:</strong> {detail.ulica}, {detail.kodPocztowy} {detail.miasto}</div>
                      {detail.uwagi && <div style={{ gridColumn: "1/-1" }}><strong>Uwagi:</strong> {detail.uwagi}</div>}
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, color: "#cbd5e1", marginBottom: 14 }}>
                      <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        <th style={{ textAlign: "left", padding: "6px 8px", color: "#64748b" }}>Produkt</th>
                        <th style={{ textAlign: "center", padding: "6px 8px", color: "#64748b" }}>Ilość</th>
                        <th style={{ textAlign: "right", padding: "6px 8px", color: "#64748b" }}>Kwota</th>
                      </tr></thead>
                      <tbody>
                        {detail.pozycje?.map(p => (
                          <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                            <td style={{ padding: "6px 8px" }}>{p.nazwaSnapshot}{p.wariant ? ` (${p.wariant})` : ""}</td>
                            <td style={{ padding: "6px 8px", textAlign: "center" }}>{p.ilosc}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right" }}>{fmtPLN(p.cena * p.ilosc)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>Status:</span>
                      {Object.entries(STATUS_MAP).map(([key, val]) => (
                        <button key={key} onClick={() => changeStatus(z.id, key)}
                          style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontWeight: 600,
                            background: z.status === key ? val.bg : "transparent",
                            color: z.status === key ? val.color : "#475569",
                            border: `1px solid ${z.status === key ? val.border : "rgba(255,255,255,0.08)"}` }}>
                          {val.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
