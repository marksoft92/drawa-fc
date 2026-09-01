"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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
  const [tab, setTab] = useState("sponsorzy");

  const tabBtn = (key) => ({
    padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
    background: tab === key ? "rgba(59,130,246,0.15)" : "transparent",
    color: tab === key ? "#3b82f6" : "#64748b",
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 3, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20, width: "fit-content" }}>
        <button onClick={() => setTab("sponsorzy")} style={tabBtn("sponsorzy")}>Sponsorzy</button>
        <button onClick={() => setTab("leady")} style={tabBtn("leady")}>Pozyskiwanie</button>
      </div>
      {tab === "sponsorzy" && <SponsorzyTab />}
      {tab === "leady" && <LeadyTab />}
    </div>
  );
}

function SponsorzyTab() {
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

// ━━━ POZYSKIWANIE (CRM) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const LEAD_STATUSY = [
  { key: "NOWY", label: "Nowy", color: "#64748b" },
  { key: "KONTAKT", label: "Kontakt", color: "#3b82f6" },
  { key: "NEGOCJACJE", label: "Negocjacje", color: "#f59e0b" },
  { key: "PODPISANE", label: "Podpisane", color: "#22c55e" },
  { key: "ODRZUCONE", label: "Odrzucone", color: "#ef4444" },
];
const leadStatusInfo = (key) => LEAD_STATUSY.find(s => s.key === key) || LEAD_STATUSY[0];
const emptyLeadForm = () => ({ nazwa: "", osobaKontaktowa: "", telefon: "", email: "", www: "", adres: "", zrodlo: "", wartosc: "", nastepnyKontakt: "" });
const isLeadOverdue = (l) => l.nastepnyKontakt && new Date(l.nastepnyKontakt) < new Date() && l.status !== "PODPISANE" && l.status !== "ODRZUCONE";
const authorName = (a) => a?.player?.imieNazwisko || a?.login || "—";

function LeadyTab() {
  const [subTab, setSubTab] = useState("lista");
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button onClick={() => setSubTab("lista")} style={{ ...btnGhost, ...(subTab === "lista" ? { borderColor: "rgba(59,130,246,0.4)", color: "#3b82f6" } : {}) }}>Lista leadów</button>
        <button onClick={() => setSubTab("skanuj")} style={{ ...btnGhost, ...(subTab === "skanuj" ? { borderColor: "rgba(167,139,250,0.4)", color: "#a78bfa" } : {}) }}>Skanuj region</button>
      </div>
      {subTab === "lista" ? <LeadyLista /> : <LeadySkanuj />}
    </div>
  );
}

function LeadyLista() {
  const [leady, setLeady] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [view, setView] = useState("list");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyLeadForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tick, setTick] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});
  const [noteSaving, setNoteSaving] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const qs = filterStatus ? `?status=${filterStatus}` : "";
    fetch(`/api/admin/sponsorzy/leady${qs}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setLeady(Array.isArray(d) ? d : []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filterStatus, tick]);

  function openCreate() { setEditId(null); setForm(emptyLeadForm()); setError(""); setView("form"); }
  function openEdit(l) {
    setEditId(l.id);
    setForm({
      nazwa: l.nazwa, osobaKontaktowa: l.osobaKontaktowa || "", telefon: l.telefon || "", email: l.email || "",
      www: l.www || "", adres: l.adres || "", zrodlo: l.zrodlo || "",
      wartosc: l.wartosc ?? "", nastepnyKontakt: l.nastepnyKontakt ? l.nastepnyKontakt.slice(0, 10) : "",
    });
    setError(""); setView("form");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      const url = editId ? `/api/admin/sponsorzy/leady/${editId}` : "/api/admin/sponsorzy/leady";
      const r = await fetch(url, { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Błąd"); setSaving(false); return; }
      setSuccess(editId ? "Zapisano zmiany" : "Lead dodany");
      setTick(t => t + 1); setView("list");
      setTimeout(() => setSuccess(""), 2500);
    } catch { setError("Błąd połączenia"); }
    finally { setSaving(false); }
  }

  async function setStatus(l, status) {
    await fetch(`/api/admin/sponsorzy/leady/${l.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setTick(t => t + 1);
  }

  async function handleDelete(l) {
    if (!confirm(`Usunąć lead "${l.nazwa}"?`)) return;
    await fetch(`/api/admin/sponsorzy/leady/${l.id}`, { method: "DELETE" });
    setTick(t => t + 1);
  }

  async function convertToSponsor(l) {
    if (!confirm(`Utworzyć sponsora "${l.nazwa}"? Trafi na listę sponsorów jako nieaktywny — uzupełnisz logo i opis przed publikacją.`)) return;
    try {
      const r = await fetch(`/api/admin/sponsorzy/leady/${l.id}/konwertuj`, { method: "POST" });
      const d = await r.json();
      if (r.ok) { setSuccess("Utworzono sponsora — uzupełnij logo i opis w zakładce Sponsorzy"); setTick(t => t + 1); setTimeout(() => setSuccess(""), 4000); }
      else alert(d.error || "Błąd konwersji");
    } catch { alert("Błąd połączenia z serwerem — spróbuj ponownie za chwilę."); }
  }

  async function addNote(l) {
    const tresc = (noteDrafts[l.id] || "").trim();
    if (!tresc) return;
    setNoteSaving(l.id);
    const r = await fetch(`/api/admin/sponsorzy/leady/${l.id}/notatki`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tresc }) });
    if (r.ok) { setNoteDrafts(p => ({ ...p, [l.id]: "" })); setTick(t => t + 1); }
    setNoteSaving(null);
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const fmtDate = (d) => {
    if (!d) return "";
    try { return new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return ""; }
  };

  if (view === "form") return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <button onClick={() => setView("list")} style={btnGhost}>← Wróć</button>
        <div style={{ fontSize: "clamp(18px,4vw,26px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>
          {editId ? "Edytuj lead" : "Nowy lead"}
        </div>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={card}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={lbl}>NAZWA FIRMY *</label>
              <input style={inp} value={form.nazwa} onChange={f("nazwa")} required placeholder="np. Auto Serwis Kowalski" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={lbl}>OSOBA KONTAKTOWA</label>
                <input style={inp} value={form.osobaKontaktowa} onChange={f("osobaKontaktowa")} placeholder="Jan Kowalski" />
              </div>
              <div>
                <label style={lbl}>TELEFON</label>
                <input style={inp} value={form.telefon} onChange={f("telefon")} placeholder="600 000 000" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={lbl}>EMAIL</label>
                <input style={inp} value={form.email} onChange={f("email")} placeholder="kontakt@firma.pl" />
              </div>
              <div>
                <label style={lbl}>STRONA WWW</label>
                <input style={inp} value={form.www} onChange={f("www")} placeholder="https://firma.pl" />
              </div>
            </div>
            <div>
              <label style={lbl}>ADRES</label>
              <input style={inp} value={form.adres} onChange={f("adres")} placeholder="ul. Przykładowa 1, Drawno" />
            </div>
            <div>
              <label style={lbl}>ŹRÓDŁO LEADA</label>
              <input style={inp} value={form.zrodlo} onChange={f("zrodlo")} placeholder="np. polecenie, event, skan OSM" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={lbl}>SZACOWANA WARTOŚĆ (PLN)</label>
                <input style={inp} type="number" min={0} value={form.wartosc} onChange={f("wartosc")} placeholder="2000" />
              </div>
              <div>
                <label style={lbl}>NASTĘPNY KONTAKT</label>
                <input style={inp} type="date" value={form.nastepnyKontakt} onChange={f("nastepnyKontakt")} />
              </div>
            </div>
          </div>
        </div>
        {error && <div style={alertErr}>{error}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={saving} style={btnPrimary}>{saving ? "Zapisuję..." : editId ? "Zapisz zmiany" : "Dodaj lead"}</button>
          <button type="button" onClick={() => setView("list")} style={btnGhost}>Anuluj</button>
        </div>
      </form>
      <style>{`input:focus, textarea:focus { outline: none; border-color: rgba(59,130,246,0.5) !important; } * { box-sizing: border-box; }`}</style>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "#94a3b8" }}>{leady.length} leadów</span>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp, width: "auto", minWidth: 160 }}>
            <option value="">Wszystkie statusy</option>
            {LEAD_STATUSY.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <button onClick={openCreate} style={btnPrimary}>+ Nowy lead</button>
      </div>

      {success && <div style={{ ...alertOk, marginBottom: 16 }}>{success}</div>}

      {loading ? (
        <div style={{ color: "#475569", fontSize: 13 }}>Ładowanie...</div>
      ) : leady.length === 0 ? (
        <div style={{ color: "#475569", fontSize: 13, padding: 20, textAlign: "center" }}>Brak leadów. Dodaj ręcznie albo zeskanuj region w zakładce „Skanuj region”.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {leady.map(l => {
            const isExpanded = expanded === l.id;
            const st = leadStatusInfo(l.status);
            const overdue = isLeadOverdue(l);
            return (
              <div key={l.id} style={{ ...card, padding: 0, overflow: "hidden" }}>
                <div onClick={() => setExpanded(isExpanded ? null : l.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: st.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.nazwa}</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                      {l.osobaKontaktowa || l.telefon ? `${l.osobaKontaktowa || ""}${l.osobaKontaktowa && l.telefon ? " · " : ""}${l.telefon || ""}` : "brak danych kontaktowych"}
                      {l.sponsorId && <span style={{ color: "#22c55e" }}> · sponsor utworzony</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: st.color, background: `${st.color}1a`, padding: "3px 9px", borderRadius: 5, flexShrink: 0 }}>{st.label.toUpperCase()}</span>
                  {l.nastepnyKontakt && (
                    <span style={{ fontSize: 11, color: overdue ? "#ef4444" : "#64748b", fontWeight: overdue ? 700 : 400, flexShrink: 0, whiteSpace: "nowrap" }}>
                      {overdue ? "zaległy: " : "kontakt: "}{fmtDate(l.nastepnyKontakt)}
                    </span>
                  )}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
                    <polyline points="6,9 12,15 18,9" />
                  </svg>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 14, fontSize: 12 }}>
                      {l.email && <div><span style={{ color: "#475569" }}>Email: </span><span style={{ color: "#cbd5e1" }}>{l.email}</span></div>}
                      {l.www && <div><span style={{ color: "#475569" }}>WWW: </span><a href={l.www} target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6" }}>{l.www}</a></div>}
                      {l.adres && <div><span style={{ color: "#475569" }}>Adres: </span><span style={{ color: "#cbd5e1" }}>{l.adres}</span></div>}
                      {l.zrodlo && <div><span style={{ color: "#475569" }}>Źródło: </span><span style={{ color: "#cbd5e1" }}>{l.zrodlo}</span></div>}
                      {l.wartosc != null && <div><span style={{ color: "#475569" }}>Szac. wartość: </span><span style={{ color: "#cbd5e1" }}>{l.wartosc} zł</span></div>}
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                      {LEAD_STATUSY.map(s => (
                        <button key={s.key} onClick={() => setStatus(l, s.key)}
                          style={{
                            ...btnRowAction,
                            color: l.status === s.key ? s.color : "#64748b",
                            borderColor: l.status === s.key ? `${s.color}55` : "rgba(255,255,255,0.08)",
                            background: l.status === s.key ? `${s.color}1a` : "none",
                          }}>
                          {s.label}
                        </button>
                      ))}
                    </div>

                    {/* Notatki */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 8 }}>HISTORIA KONTAKTU</div>
                      {(l.notatki || []).length === 0 && <div style={{ fontSize: 12, color: "#334155", marginBottom: 8 }}>Brak notatek.</div>}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                        {(l.notatki || []).map(n => (
                          <div key={n.id} style={{ fontSize: 12, color: "#cbd5e1", background: "rgba(255,255,255,0.03)", borderRadius: 7, padding: "8px 10px" }}>
                            <div style={{ fontSize: 10, color: "#475569", marginBottom: 3 }}>{authorName(n.author)} · {fmtDate(n.createdAt)}</div>
                            {n.tresc}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          style={{ ...inp, flex: 1 }}
                          placeholder="Dodaj notatkę z kontaktu..."
                          value={noteDrafts[l.id] || ""}
                          onChange={e => setNoteDrafts(p => ({ ...p, [l.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === "Enter") addNote(l); }}
                        />
                        <button onClick={() => addNote(l)} disabled={noteSaving === l.id || !(noteDrafts[l.id] || "").trim()} style={{ ...btnGhost, opacity: noteSaving === l.id ? 0.6 : 1 }}>
                          {noteSaving === l.id ? "..." : "Dodaj"}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {!l.sponsorId ? (
                        <button onClick={() => convertToSponsor(l)} style={{ ...btnRowAction, color: "#22c55e", borderColor: "rgba(34,197,94,0.3)" }}>Konwertuj na sponsora</button>
                      ) : (
                        <span style={{ ...btnRowAction, color: "#22c55e", borderColor: "rgba(34,197,94,0.3)", cursor: "default" }}>Sponsor: {l.sponsor?.nazwa}</span>
                      )}
                      <button onClick={() => openEdit(l)} style={btnRowAction}>Edytuj</button>
                      <button onClick={() => handleDelete(l)} style={{ ...btnRowAction, color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" }}>Usuń</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <style>{`* { box-sizing: border-box; }`}</style>
    </div>
  );
}

function LeadySkanuj() {
  const [powiaty, setPowiaty] = useState([]);
  const [selected, setSelected] = useState("");
  const [jobStatus, setJobStatus] = useState({ status: "idle" });
  const [results, setResults] = useState(null);
  const [scannedPowiat, setScannedPowiat] = useState("");
  const [scanError, setScanError] = useState("");
  const [adding, setAdding] = useState({});
  const [added, setAdded] = useState({});
  const pollRef = useRef(null);

  useEffect(() => {
    fetch("/api/admin/sponsorzy/leady/skanuj").then(r => r.json()).then(setPowiaty).catch(() => {});
  }, []);

  const pollStatus = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/sponsorzy/leady/skanuj/status");
      if (!r.ok) return;
      const s = await r.json();
      setJobStatus(s);
      if (s.status === "done" || s.status === "error") {
        clearInterval(pollRef.current);
        pollRef.current = null;
        if (s.status === "done") { setResults(s.results || []); setScannedPowiat(s.powiat); setAdded({}); }
        else setScanError(s.error || "Błąd skanowania");
      }
    } catch {}
  }, []);

  // Wznów polling, jeśli skan już trwał (np. po odświeżeniu strony).
  useEffect(() => {
    pollStatus();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pollStatus]);
  useEffect(() => {
    if (jobStatus.status === "running" && !pollRef.current) {
      pollRef.current = setInterval(pollStatus, 3000);
    }
  }, [jobStatus.status, pollStatus]);

  const scan = async () => {
    if (!selected) return;
    setScanError(""); setResults(null); setAdded({});
    const r = await fetch("/api/admin/sponsorzy/leady/skanuj", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ powiat: selected }),
    });
    if (r.ok) {
      setJobStatus({ status: "running", powiat: selected, progress: "Uruchamianie..." });
      if (!pollRef.current) pollRef.current = setInterval(pollStatus, 3000);
    } else {
      const d = await r.json().catch(() => ({}));
      setScanError(d.error || "Nie udało się uruchomić skanu");
    }
  };

  const stopScan = async () => {
    await fetch("/api/admin/sponsorzy/leady/skanuj/status", { method: "DELETE" });
    clearInterval(pollRef.current);
    pollRef.current = null;
    setJobStatus({ status: "idle" });
  };

  const addLead = async (t) => {
    setAdding(p => ({ ...p, [t.nazwa]: true }));
    try {
      const r = await fetch("/api/admin/sponsorzy/leady", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nazwa: t.nazwa, telefon: t.telefon, www: t.www, adres: t.adres, zrodlo: `OSM — ${scannedPowiat} (${t.kategoria})` }),
      });
      if (r.ok) setAdded(p => ({ ...p, [t.nazwa]: true }));
    } catch {}
    setAdding(p => ({ ...p, [t.nazwa]: false }));
  };

  const addAll = async () => {
    if (!results) return;
    const toAdd = results.filter(t => t.status !== "exists" && !added[t.nazwa]);
    for (const t of toAdd) await addLead(t);
  };

  const scanning = jobStatus.status === "running";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 8 }}>Skanuj firmy w regionie (OpenStreetMap)</div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
          Pobiera z OpenStreetMap nazwane sklepy, biura, firmy rzemieślnicze i lokale usługowe z wybranego powiatu
          (dane publiczne, bez skrobania serwisów komercyjnych) i podpowiada je jako leady do pozyskania. Skan działa
          w tle i sam ponawia próby przez kilka minut, jeśli publiczny serwer Overpass jest akurat przeciążony.
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select value={selected} onChange={e => setSelected(e.target.value)} disabled={scanning} style={{ ...inp, width: "auto", minWidth: 240 }}>
            <option value="">Wybierz powiat...</option>
            {powiaty.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {!scanning ? (
            <button onClick={scan} disabled={!selected} style={{ ...btnPrimary, background: "#7c3aed", opacity: !selected ? 0.5 : 1 }}>
              Skanuj powiat
            </button>
          ) : (
            <button onClick={stopScan} style={{ ...btnGhost, color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}>Przerwij skan</button>
          )}
        </div>
        {scanError && <div style={{ ...alertErr, marginTop: 12 }}>{scanError}</div>}
      </div>

      {scanning && (
        <div style={{ ...card, textAlign: "center", color: "#a78bfa" }}>
          <div style={{ fontSize: 13 }}>{jobStatus.progress || "Skanuję..."}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>Możesz zostawić to działające i wrócić za chwilę — nie trzeba czekać na tej stronie.</div>
        </div>
      )}

      {results && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
              {results.length} firm znalezionych
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 400, marginLeft: 8 }}>
                ({results.filter(t => t.status === "exists").length} już w bazie)
              </span>
            </span>
            {results.some(t => t.status !== "exists" && !added[t.nazwa]) && (
              <button onClick={addAll} style={{ ...btnPrimary, background: "#22c55e", fontSize: 12 }}>
                Dodaj wszystkie jako leady ({results.filter(t => t.status !== "exists" && !added[t.nazwa]).length})
              </button>
            )}
          </div>

          {results.map(t => {
            const isDone = added[t.nazwa] || t.status === "exists";
            return (
              <div key={t.nazwa} style={{ ...card, display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", opacity: isDone ? 0.5 : 1 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{t.nazwa}</div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                    {t.kategoria}{t.adres ? ` · ${t.adres}` : ""}{t.telefon ? ` · ${t.telefon}` : ""}
                  </div>
                </div>
                {isDone ? (
                  <span style={{ fontSize: 11, color: "#22c55e" }}>{t.status === "exists" ? "już w bazie" : "dodano"}</span>
                ) : (
                  <button onClick={() => addLead(t)} disabled={adding[t.nazwa]} style={{ ...btnRowAction, color: "#22c55e", borderColor: "rgba(34,197,94,0.3)" }}>
                    {adding[t.nazwa] ? "..." : "Dodaj jako lead"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
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
