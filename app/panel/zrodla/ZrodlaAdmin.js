"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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

// ━━━ MAIN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function ZrodlaAdmin() {
  const [tab, setTab] = useState("zrodla");

  const tabBtn = (key) => ({
    padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
    background: tab === key ? "rgba(59,130,246,0.15)" : "transparent",
    color: tab === key ? "#3b82f6" : "#64748b",
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: "clamp(20px,4vw,28px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>
          Piłka lokalna
        </div>
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 3, border: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={() => setTab("zrodla")} style={tabBtn("zrodla")}>Źródła</button>
          <button onClick={() => setTab("nowe")} style={tabBtn("nowe")}>Do akceptacji</button>
          <button onClick={() => setTab("opublikowane")} style={tabBtn("opublikowane")}>Opublikowane</button>
        </div>
      </div>
      {tab === "zrodla" && <ZrodlaTab />}
      {tab === "nowe" && <WpisyTab published={false} />}
      {tab === "opublikowane" && <WpisyTab published={true} />}
      <style>{`input:focus,select:focus,textarea:focus{outline:none;border-color:rgba(59,130,246,0.5)!important} *{box-sizing:border-box}`}</style>
    </div>
  );
}

// ━━━ ŹRÓDŁA TAB ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ZrodlaTab() {
  const [zrodla, setZrodla] = useState([]);
  const [view, setView] = useState("list");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nazwa: "", fbUrl: "", herb: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tick, setTick] = useState(0);

  // Scraper status
  const [scrStatus, setScrStatus] = useState({ status: "idle" });
  const [scraperEnabled, setScraperEnabled] = useState(true);
  const [togglingScr, setTogglingScr] = useState(false);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/zrodla");
    if (r.ok) setZrodla(await r.json());
  }, []);

  useEffect(() => { load(); }, [load, tick]);

  useEffect(() => {
    fetch("/api/ustawienia").then(r => r.json()).then(u => {
      if (u.scraper_fb_aktywny !== undefined) setScraperEnabled(u.scraper_fb_aktywny !== "0");
    }).catch(() => {});
  }, []);

  const toggleScraperEnabled = async () => {
    setTogglingScr(true);
    const next = !scraperEnabled;
    const r = await fetch("/api/admin/ustawienia", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scraper_fb_aktywny: next ? "1" : "0" }),
    });
    if (r.ok) setScraperEnabled(next);
    setTogglingScr(false);
  };

  // Poll scraper status
  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch("/api/admin/zrodla/scraper");
        if (r.ok) setScrStatus(await r.json());
      } catch {}
    };
    poll();
    if (scrStatus.status === "running") {
      pollRef.current = setInterval(poll, 3000);
      return () => clearInterval(pollRef.current);
    }
  }, [scrStatus.status, tick]);

  const startScraper = async () => {
    const r = await fetch("/api/admin/zrodla/scraper", { method: "POST" });
    if (r.ok) setScrStatus({ status: "running", progress: "Uruchamianie..." });
  };

  const resetScraper = async () => {
    await fetch("/api/admin/zrodla/scraper", { method: "DELETE" });
    setScrStatus({ status: "idle" });
    setTick(t => t + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null);
    const url = editId ? `/api/admin/zrodla/${editId}` : "/api/admin/zrodla";
    const method = editId ? "PATCH" : "POST";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (r.ok) {
      setSuccess(editId ? "Zapisano" : "Dodano źródło");
      setView("list"); setEditId(null); setForm({ nazwa: "", fbUrl: "", herb: "" }); setTick(t => t + 1);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "Błąd zapisu");
    }
    setSaving(false);
  };

  const toggleActive = async (z) => {
    await fetch(`/api/admin/zrodla/${z.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aktywne: !z.aktywne }) });
    setTick(t => t + 1);
  };

  const del = async (z) => {
    if (!confirm(`Usunąć "${z.nazwa}" i wszystkie wpisy?`)) return;
    await fetch(`/api/admin/zrodla/${z.id}`, { method: "DELETE" });
    setTick(t => t + 1);
  };

  if (view === "form") return (
    <div>
      <button onClick={() => { setView("list"); setEditId(null); }} style={btnGhost}>← Wróć</button>
      <div style={{ ...card, marginTop: 12 }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={lbl}>NAZWA KLUBU / STRONY</label>
            <input style={inp} value={form.nazwa} onChange={e => setForm(f => ({ ...f, nazwa: e.target.value }))} placeholder="np. Gryf Słosinko" required />
          </div>
          <div>
            <label style={lbl}>LINK DO FACEBOOKA</label>
            <input style={inp} value={form.fbUrl} onChange={e => setForm(f => ({ ...f, fbUrl: e.target.value }))} placeholder="https://www.facebook.com/gryfslosinko" required />
          </div>
          <div>
            <label style={lbl}>HERB (URL OBRAZKA, OPCJONALNIE)</label>
            <input style={inp} value={form.herb} onChange={e => setForm(f => ({ ...f, herb: e.target.value }))} placeholder="/herby/gryf.png" />
          </div>
          {form.herb && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src={form.herb} alt="" style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 4 }} onError={e => e.target.style.display = "none"} />
              <span style={{ fontSize: 11, color: "#64748b" }}>Podgląd herbu</span>
            </div>
          )}
          {error && <div style={alertErr}>{error}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
              {saving ? "Zapisuję..." : editId ? "Zapisz zmiany" : "Dodaj źródło"}
            </button>
            <button type="button" onClick={() => { setView("list"); setEditId(null); }} style={btnGhost}>Anuluj</button>
          </div>
        </form>
      </div>
    </div>
  );

  // Scraper status colors
  const statusDot = { idle: "#64748b", running: "#fbbf24", done: "#22c55e", error: "#ef4444" }[scrStatus.status] || "#64748b";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {success && <div style={alertOk}>{success}</div>}

      {/* Scraper control */}
      <div style={{ ...card, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: !scraperEnabled ? "#64748b" : statusDot, boxShadow: scrStatus.status === "running" && scraperEnabled ? `0 0 8px ${statusDot}` : "none", animation: scrStatus.status === "running" && scraperEnabled ? "pulse 1.5s infinite" : "none" }} />
          <span style={{ fontSize: 13, color: !scraperEnabled ? "#64748b" : "#94a3b8" }}>
            {!scraperEnabled ? "Scraper wyłączony" : (
              <>
                {scrStatus.status === "idle" && "Scraper gotowy"}
                {scrStatus.status === "running" && (scrStatus.progress || "Pracuję...")}
                {scrStatus.status === "done" && `Gotowe — ${scrStatus.stats?.noweWpisy || 0} nowych wpisów`}
                {scrStatus.status === "error" && (scrStatus.progress || "Błąd")}
              </>
            )}
          </span>
        </div>
        <button
          onClick={toggleScraperEnabled}
          disabled={togglingScr}
          style={{
            ...btnGhost,
            color: scraperEnabled ? "#22c55e" : "#ef4444",
            borderColor: scraperEnabled ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
            opacity: togglingScr ? 0.5 : 1,
          }}
        >
          {scraperEnabled ? "Włączony" : "Wyłączony"}
        </button>
        {scraperEnabled && scrStatus.status !== "running" && (
          <button onClick={startScraper} style={btnPrimary} disabled={!zrodla.length}>Uruchom scraper</button>
        )}
        {(scrStatus.status === "done" || scrStatus.status === "error") && (
          <button onClick={resetScraper} style={btnGhost}>Resetuj</button>
        )}
        {scrStatus.status === "done" && scrStatus.stats?.bledy?.length > 0 && (
          <div style={{ width: "100%", fontSize: 11, color: "#ef4444", marginTop: 4 }}>
            {scrStatus.stats.bledy.map((e, i) => <div key={i}>{e}</div>)}
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Sources list */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 14, color: "#94a3b8" }}>{zrodla.length} źródeł</span>
        <button onClick={() => { setForm({ nazwa: "", fbUrl: "", herb: "" }); setEditId(null); setView("form"); }} style={btnPrimary}>+ Dodaj źródło</button>
      </div>

      {zrodla.map(z => (
        <div key={z.id} style={{ ...card, display: "flex", alignItems: "center", gap: 12, opacity: z.aktywne ? 1 : 0.5 }}>
          {z.herb ? (
            <img src={z.herb} alt="" style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 4 }} />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: 4, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#475569" }}>FB</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, color: "#fff", fontWeight: 600 }}>{z.nazwa}</div>
            <div style={{ fontSize: 11, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{z.fbUrl}</div>
          </div>
          <div style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>{z._count?.wpisy || 0} wpisów</div>
          <button onClick={() => toggleActive(z)} style={{ ...btnRow, color: z.aktywne ? "#22c55e" : "#64748b" }}>{z.aktywne ? "Aktywne" : "Wyłączone"}</button>
          <button onClick={() => { setForm({ nazwa: z.nazwa, fbUrl: z.fbUrl, herb: z.herb || "" }); setEditId(z.id); setView("form"); }} style={btnRow}>Edytuj</button>
          <button onClick={() => del(z)} style={{ ...btnRow, color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" }}>Usuń</button>
        </div>
      ))}

      {!zrodla.length && (
        <div style={{ textAlign: "center", padding: 40, color: "#475569", fontSize: 13 }}>
          Brak źródeł. Dodaj stronę FB klubu, żeby zacząć agregować posty.
        </div>
      )}
    </div>
  );
}

// ━━━ WPISY TAB ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function WpisyTab({ published }) {
  const [wpisy, setWpisy] = useState([]);
  const [total, setTotal] = useState(0);
  const [zrodla, setZrodla] = useState([]);
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [tick, setTick] = useState(0);
  const [success, setSuccess] = useState(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ published: String(published) });
    if (filter) params.set("zrodloId", filter);
    const r = await fetch(`/api/admin/zrodla/wpisy?${params}`);
    if (r.ok) {
      const d = await r.json();
      setWpisy(d.wpisy || []);
      setTotal(d.total || 0);
    }
  }, [published, filter, tick]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch("/api/admin/zrodla").then(r => r.json()).then(setZrodla).catch(() => {});
  }, []);

  const startEdit = (w) => {
    setEditId(w.id);
    setEditForm({
      tytul: w.tytul || "",
      tresc: w.tresc || "",
      miniaturka: w.miniaturka || "",
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    const body = { ...editForm };
    if (body.tytul && !body.slug) {
      body.slug = slugify(body.tytul);
    }
    const r = await fetch(`/api/admin/zrodla/wpisy/${editId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      setEditId(null);
      setTick(t => t + 1);
      setSuccess("Zapisano");
      setTimeout(() => setSuccess(null), 2000);
    }
    setSaving(false);
  };

  const publish = async (w) => {
    if (!w.tytul && !editForm.tytul) {
      alert("Najpierw uzupełnij tytuł wpisu");
      startEdit(w);
      return;
    }
    const r = await fetch(`/api/admin/zrodla/wpisy/${w.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: true }),
    });
    if (r.ok) {
      setTick(t => t + 1);
      setSuccess("Opublikowano!");
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  const unpublish = async (w) => {
    await fetch(`/api/admin/zrodla/wpisy/${w.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: false }),
    });
    setTick(t => t + 1);
  };

  const del = async (w) => {
    if (!confirm("Odrzucić i usunąć ten wpis?")) return;
    await fetch(`/api/admin/zrodla/wpisy/${w.id}`, { method: "DELETE" });
    setTick(t => t + 1);
  };

  const fmtDate = (d) => {
    if (!d) return "";
    try { return new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return d; }
  };

  const fmtDateShort = (d) => {
    if (!d) return "Brak daty";
    try { return new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return d; }
  };

  // Group posts by dataPostu date
  const grouped = {};
  wpisy.forEach(w => {
    const key = w.dataPostu || "brak-daty";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(w);
  });
  const dateKeys = Object.keys(grouped).sort((a, b) => {
    if (a === "brak-daty") return 1;
    if (b === "brak-daty") return -1;
    return b.localeCompare(a);
  });

  const [collapsedDates, setCollapsedDates] = useState({});
  const toggleDate = (key) => setCollapsedDates(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {success && <div style={alertOk}>{success}</div>}

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "#94a3b8" }}>{total} wpisów</span>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ ...inp, width: "auto", minWidth: 160 }}>
          <option value="">Wszystkie źródła</option>
          {zrodla.map(z => <option key={z.id} value={z.id}>{z.nazwa}</option>)}
        </select>
      </div>

      {/* Date groups */}
      {dateKeys.map(dateKey => {
        const items = grouped[dateKey];
        const isCollapsed = collapsedDates[dateKey];
        return (
          <div key={dateKey}>
            {/* Date header — clickable to toggle */}
            <div
              onClick={() => toggleDate(dateKey)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 0", cursor: "pointer",
                borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 8,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"
                style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}>
                <polyline points="6,9 12,15 18,9" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.03em" }}>
                {fmtDateShort(dateKey === "brak-daty" ? null : dateKey)}
              </span>
              <span style={{ fontSize: 11, color: "#475569" }}>({items.length})</span>
            </div>

            {/* Posts in this date group */}
            {!isCollapsed && items.map(w => {
        const isExpanded = expanded === w.id;
        const isEditing = editId === w.id;
        const images = Array.isArray(w.obrazki) ? w.obrazki : [];

        return (
          <div key={w.id} style={{ ...card, padding: 0, overflow: "hidden" }}>
            {/* Header row */}
            <div
              onClick={() => setExpanded(isExpanded ? null : w.id)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", cursor: "pointer" }}
            >
              {w.zrodlo?.herb ? (
                <img src={w.zrodlo.herb} alt="" style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 4, flexShrink: 0 }} />
              ) : (
                <div style={{ width: 28, height: 28, borderRadius: 4, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#475569", flexShrink: 0 }}>FB</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: w.tytul ? "#fff" : "#64748b", fontWeight: w.tytul ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {w.tytul || w.tresc.slice(0, 80) + (w.tresc.length > 80 ? "..." : "")}
                </div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                  {w.zrodlo?.nazwa} · {fmtDate(w.createdAt)}
                </div>
              </div>
              {images.length > 0 && (
                <div style={{ display: "flex", gap: 3 }}>
                  {images.slice(0, 3).map((img, i) => (
                    <img key={i} src={img} alt="" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 4 }} />
                  ))}
                  {images.length > 3 && <span style={{ fontSize: 10, color: "#64748b", alignSelf: "center" }}>+{images.length - 3}</span>}
                </div>
              )}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px 20px" }}>
                {isEditing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label style={lbl}>TYTUŁ</label>
                      <input style={inp} value={editForm.tytul} onChange={e => setEditForm(f => ({ ...f, tytul: e.target.value }))} placeholder="Tytuł wpisu (wymagany do publikacji)" />
                    </div>
                    <div>
                      <label style={lbl}>TREŚĆ</label>
                      <textarea style={{ ...inp, height: 160, fontFamily: "monospace", resize: "vertical" }} value={editForm.tresc} onChange={e => setEditForm(f => ({ ...f, tresc: e.target.value }))} />
                    </div>
                    <div>
                      <label style={lbl}>MINIATURKA</label>
                      {images.length > 0 && (
                        <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                          {images.map((img, i) => (
                            <img
                              key={i} src={img} alt=""
                              onClick={() => setEditForm(f => ({ ...f, miniaturka: img }))}
                              style={{
                                width: 64, height: 64, objectFit: "cover", borderRadius: 6, cursor: "pointer",
                                border: editForm.miniaturka === img ? "2px solid #3b82f6" : "2px solid transparent",
                              }}
                            />
                          ))}
                        </div>
                      )}
                      <input style={inp} value={editForm.miniaturka} onChange={e => setEditForm(f => ({ ...f, miniaturka: e.target.value }))} placeholder="URL miniaturki" />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={saveEdit} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>{saving ? "Zapisuję..." : "Zapisz"}</button>
                      <button onClick={() => setEditId(null)} style={btnGhost}>Anuluj</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.7, whiteSpace: "pre-wrap", marginBottom: images.length ? 12 : 0 }}>
                      {w.tresc}
                    </div>
                    {images.length > 0 && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                        {images.map((img, i) => (
                          <img key={i} src={img} alt="" style={{ maxWidth: 240, maxHeight: 180, objectFit: "cover", borderRadius: 8 }} />
                        ))}
                      </div>
                    )}
                    {w.dataPostu && <div style={{ fontSize: 11, color: "#475569", marginBottom: 8 }}>Post z: {w.dataPostu}</div>}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={() => startEdit(w)} style={btnRow}>Edytuj</button>
                      {!published && (
                        <button onClick={() => publish(w)} style={{ ...btnRow, color: "#22c55e", borderColor: "rgba(34,197,94,0.3)" }}>Publikuj</button>
                      )}
                      {published && (
                        <button onClick={() => unpublish(w)} style={{ ...btnRow, color: "#fbbf24", borderColor: "rgba(251,191,36,0.3)" }}>Cofnij publikację</button>
                      )}
                      <button onClick={() => del(w)} style={{ ...btnRow, color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" }}>
                        {published ? "Usuń" : "Odrzuć"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
          </div>
        );
      })}

      {!wpisy.length && (
        <div style={{ textAlign: "center", padding: 40, color: "#475569", fontSize: 13 }}>
          {published ? "Brak opublikowanych wpisów." : "Brak nowych wpisów do akceptacji. Uruchom scraper w zakładce Źródła."}
        </div>
      )}
    </div>
  );
}
