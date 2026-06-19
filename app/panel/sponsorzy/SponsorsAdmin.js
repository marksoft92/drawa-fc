"use client";

import { useState, useEffect, useRef } from "react";

function slugify(str) {
  return str.toLowerCase()
    .replace(/ą/g,"a").replace(/ć/g,"c").replace(/ę/g,"e").replace(/ł/g,"l")
    .replace(/ń/g,"n").replace(/ó/g,"o").replace(/ś/g,"s").replace(/ź/g,"z").replace(/ż/g,"z")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const emptyForm = () => ({ nazwa: "", slug: "", logo: "", href: "", facebook: "", instagram: "", opis: "", opisDlugi: "", kolejnosc: 0, aktywny: true });

async function uploadLogo(file, onError) {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch("/api/admin/sponsorzy/upload", { method: "POST", body: fd });
  const d = await r.json();
  if (!r.ok) { onError(d.error || "Błąd uploadu"); return null; }
  return d.url;
}

function LogoField({ value, onChange, onError }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    const url = await uploadLogo(file, onError);
    if (url) onChange(url);
    setUploading(false);
  }

  return (
    <div>
      <label style={lbl}>LOGO</label>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 72, height: 72, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
          {value
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={value} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            : <span style={{ fontSize: 22, opacity: 0.2 }}>🏢</span>
          }
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files?.[0])} />
            <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
              style={{ ...btnGhost, fontSize: 12, padding: "7px 14px", opacity: uploading ? 0.6 : 1 }}>
              {uploading ? "Wgrywam..." : value ? "Zmień logo" : "Wgraj logo"}
            </button>
            {value && (
              <button type="button" onClick={() => onChange("")} style={{ ...btnGhost, fontSize: 12, padding: "7px 12px", color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" }}>
                Usuń
              </button>
            )}
          </div>
          <input style={{ ...inp, fontSize: 12 }} value={value} onChange={e => onChange(e.target.value)} placeholder="lub wklej URL / ścieżkę (np. /sponsorzy/logo.png)" />
        </div>
      </div>
    </div>
  );
}

export default function SponsorsAdmin() {
  const [sponsorzy, setSponsorzy] = useState([]);
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
    fetch("/api/admin/sponsorzy")
      .then(r => r.json())
      .then(d => { if (!cancelled) setSponsorzy(Array.isArray(d) ? d : []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tick]);

  function openCreate() {
    setEditId(null); setForm(emptyForm());
    setError(""); setSuccess(""); setView("form");
  }

  function openEdit(s) {
    setEditId(s.id);
    setForm({ nazwa: s.nazwa, slug: s.slug || "", logo: s.logo || "", href: s.href || "", facebook: s.facebook || "", instagram: s.instagram || "", opis: s.opis || "", opisDlugi: s.opisDlugi || "", kolejnosc: s.kolejnosc, aktywny: s.aktywny });
    setError(""); setSuccess(""); setView("form");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSaving(true);
    const payload = { ...form, kolejnosc: Number(form.kolejnosc) || 0 };
    try {
      const url = editId ? `/api/admin/sponsorzy/${editId}` : "/api/admin/sponsorzy";
      const r = await fetch(url, { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Błąd"); setSaving(false); return; }
      setSuccess(editId ? "Zapisano zmiany" : "Sponsor dodany");
      setTick(t => t + 1); setView("list");
    } catch { setError("Błąd połączenia"); }
    finally { setSaving(false); }
  }

  async function toggleActive(s) {
    await fetch(`/api/admin/sponsorzy/${s.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aktywny: !s.aktywny }) });
    setTick(t => t + 1);
  }

  async function moveOrder(s, dir) {
    await fetch(`/api/admin/sponsorzy/${s.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kolejnosc: s.kolejnosc + dir }) });
    setTick(t => t + 1);
  }

  async function handleDelete(s) {
    if (!confirm(`Usunąć sponsora "${s.nazwa}"?`)) return;
    await fetch(`/api/admin/sponsorzy/${s.id}`, { method: "DELETE" });
    setTick(t => t + 1);
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  if (view === "form") return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <button onClick={() => setView("list")} style={btnGhost}>← Wróć</button>
        <div style={{ fontSize: "clamp(18px,4vw,26px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>
          {editId ? "Edytuj sponsora" : "Nowy sponsor"}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={card}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={lbl}>NAZWA *</label>
                <input style={inp} value={form.nazwa} onChange={e => { const n = e.target.value; setForm(p => ({ ...p, nazwa: n, slug: editId ? p.slug : slugify(n) })); }} required placeholder="Nazwa firmy / osoby" />
              </div>
              <div>
                <label style={lbl}>SLUG (URL podstrony)</label>
                <input style={inp} value={form.slug} onChange={f("slug")} placeholder="nazwa-firmy" />
                <div style={{ fontSize: 10, color: "#334155", marginTop: 4 }}>mksdrawadrawno.pl/sponsor/{form.slug || "..."}</div>
              </div>
            </div>

            <LogoField value={form.logo} onChange={v => setForm(p => ({ ...p, logo: v }))} onError={setError} />

            <div>
              <label style={lbl}>STRONA WWW</label>
              <input style={inp} value={form.href} onChange={f("href")} placeholder="https://www.firma.pl" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={lbl}>FACEBOOK</label>
                <input style={inp} value={form.facebook} onChange={f("facebook")} placeholder="https://www.facebook.com/..." />
              </div>
              <div>
                <label style={lbl}>INSTAGRAM</label>
                <input style={inp} value={form.instagram} onChange={f("instagram")} placeholder="https://www.instagram.com/..." />
              </div>
            </div>

            <div>
              <label style={lbl}>KRÓTKI OPIS (widoczny na karcie na /wspolpraca)</label>
              <textarea style={{ ...inp, height: 50, resize: "vertical" }} value={form.opis} onChange={f("opis")} placeholder="Jednozdaniowy opis firmy..." />
            </div>

            <div>
              <label style={lbl}>DŁUGI OPIS (na osobnej podstronie sponsora)</label>
              <textarea style={{ ...inp, height: 140, resize: "vertical", fontFamily: "monospace", fontSize: 12 }} value={form.opisDlugi} onChange={f("opisDlugi")} placeholder="Pełny opis firmy, historia współpracy, czym się zajmują... Akapity oddziel pustą linią." />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={lbl}>KOLEJNOŚĆ (niższy = wcześniej)</label>
                <input style={inp} type="number" value={form.kolejnosc} onChange={f("kolejnosc")} min={0} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "#94a3b8", paddingBottom: 10 }}>
                  <input type="checkbox" checked={form.aktywny} onChange={e => setForm(p => ({ ...p, aktywny: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "#3b82f6" }} />
                  Aktywny (widoczny na stronie)
                </label>
              </div>
            </div>
          </div>
        </div>

        {error && <div style={alertErr}>{error}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={saving} style={btnPrimary}>{saving ? "Zapisuję..." : editId ? "Zapisz zmiany" : "Dodaj sponsora"}</button>
          <button type="button" onClick={() => setView("list")} style={btnGhost}>Anuluj</button>
        </div>
      </form>

      <style>{`input:focus, textarea:focus { outline: none; border-color: rgba(59,130,246,0.5) !important; } * { box-sizing: border-box; }`}</style>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: "clamp(20px,4vw,28px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>Sponsorzy</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{sponsorzy.length} sponsorów</div>
        </div>
        <button onClick={openCreate} style={btnPrimary}>+ Nowy sponsor</button>
      </div>

      {success && <div style={{ ...alertOk, marginBottom: 16 }}>{success}</div>}

      {loading ? (
        <div style={{ color: "#475569", fontSize: 13 }}>Ładowanie...</div>
      ) : sponsorzy.length === 0 ? (
        <div style={{ color: "#475569", fontSize: 13, padding: 20, textAlign: "center" }}>Brak sponsorów.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sponsorzy.map((s, idx) => (
            <div key={s.id} style={{ ...card, display: "flex", alignItems: "center", gap: 12, padding: "10px 14px" }}>
              <div style={{ width: 52, height: 44, flexShrink: 0, borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {s.logo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={s.logo} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  : <span style={{ fontSize: 16, opacity: 0.2 }}>🏢</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: s.aktywny ? "#fff" : "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {s.nazwa}
                </div>
                {s.href && (
                  <div style={{ fontSize: 11, color: "#334155", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.href}</div>
                )}
              </div>
              <div style={{ fontSize: 10, color: "#334155", flexShrink: 0 }}>#{s.kolejnosc}</div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button onClick={() => moveOrder(s, -1)} disabled={idx === 0} style={{ ...btnRowAction, opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                <button onClick={() => moveOrder(s, 1)} disabled={idx === sponsorzy.length - 1} style={{ ...btnRowAction, opacity: idx === sponsorzy.length - 1 ? 0.3 : 1 }}>↓</button>
                <button onClick={() => toggleActive(s)} style={{ ...btnRowAction, color: s.aktywny ? "#22c55e" : "#475569", borderColor: s.aktywny ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)" }}>
                  {s.aktywny ? "Aktywny" : "Ukryty"}
                </button>
                <button onClick={() => openEdit(s)} style={btnRowAction}>Edytuj</button>
                <button onClick={() => handleDelete(s)} style={{ ...btnRowAction, color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" }}>Usuń</button>
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
const btnRowAction = { padding: "4px 9px", background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#64748b", fontSize: 11, cursor: "pointer" };
const alertErr = { fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "9px 13px" };
const alertOk = { fontSize: 13, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 7, padding: "9px 13px" };
