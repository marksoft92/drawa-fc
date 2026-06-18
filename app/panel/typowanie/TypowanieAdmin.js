"use client";

import { useState, useEffect, useCallback } from "react";

const cardStyle = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 12,
  padding: "16px 20px",
  marginBottom: 12,
};
const lbl = { display: "block", fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 6 };
const inp = { width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#fff", fontSize: 13, boxSizing: "border-box" };
const btnPrimary = { padding: "9px 18px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnGhost = { padding: "9px 14px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#64748b", fontSize: 13, cursor: "pointer" };
const btnDanger = { padding: "6px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, color: "#ef4444", fontSize: 11, fontWeight: 600, cursor: "pointer" };
const btnSmall = { padding: "6px 12px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 6, color: "#3b82f6", fontSize: 11, fontWeight: 600, cursor: "pointer" };

function statusLabel(t) {
  const now = new Date();
  if (t.wynikTeam1 !== null) return { text: "Rozstrzygnięte", color: "#22c55e" };
  if (new Date(t.dataRozpoczecia) <= now || !t.aktywne) return { text: "Zamknięte", color: "#f59e0b" };
  return { text: "Otwarte", color: "#3b82f6" };
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString("pl-PL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function toLocalDatetime(iso) {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

function HerbPicker({ value, onChange, herby }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = herby.filter((h) => h.name.toLowerCase().includes(search.toLowerCase()));
  const selected = herby.find((h) => h.url === value);

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          ...inp, display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
          padding: "6px 10px", minHeight: 40,
        }}
      >
        {selected ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.url} alt="" width={24} height={24} style={{ objectFit: "contain", borderRadius: 3 }} />
            <span style={{ fontSize: 12, color: "#cbd5e1", flex: 1 }}>{selected.name}</span>
          </>
        ) : (
          <span style={{ fontSize: 12, color: "#475569", flex: 1 }}>Wybierz herb...</span>
        )}
        <span style={{ fontSize: 10, color: "#475569" }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)", maxHeight: 260, display: "flex", flexDirection: "column",
        }}>
          <input
            autoFocus
            style={{ ...inp, borderRadius: "8px 8px 0 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 12 }}
            placeholder="Szukaj drużyny..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <div style={{ overflowY: "auto", flex: 1 }}>
            <div
              onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.03)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(59,130,246,0.08)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: 12, color: "#475569" }}>— brak herbu —</span>
            </div>
            {filtered.map((h) => (
              <div
                key={h.file}
                onClick={() => { onChange(h.url); setOpen(false); setSearch(""); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", cursor: "pointer",
                  background: value === h.url ? "rgba(59,130,246,0.1)" : "transparent",
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(59,130,246,0.08)"}
                onMouseLeave={(e) => e.currentTarget.style.background = value === h.url ? "rgba(59,130,246,0.1)" : "transparent"}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={h.url} alt="" width={22} height={22} style={{ objectFit: "contain", borderRadius: 3, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#cbd5e1" }}>{h.name}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: "12px 10px", fontSize: 12, color: "#475569", textAlign: "center" }}>Nie znaleziono</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function punktyColor(p) {
  if (p === 3) return "#22c55e";
  if (p === 2) return "#3b82f6";
  if (p === 1) return "#f59e0b";
  return "#475569";
}

export default function TypowanieAdmin() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ team1: "", team2: "", herb1: "", herb2: "", dataRozpoczecia: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [wynikId, setWynikId] = useState(null);
  const [wynikForm, setWynikForm] = useState({ g1: 0, g2: 0 });
  const [wynikSaving, setWynikSaving] = useState(false);

  const [wpisyId, setWpisyId] = useState(null);
  const [wpisy, setWpisy] = useState([]);
  const [wpisyLoading, setWpisyLoading] = useState(false);

  const [herby, setHerby] = useState([]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    fetch("/api/admin/typowanie")
      .then((r) => r.json())
      .then(setLista)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tick]);

  useEffect(() => {
    fetch("/api/admin/typowanie/herby").then((r) => r.json()).then(setHerby).catch(() => {});
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const r = await fetch("/api/admin/typowanie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team1: form.team1,
          team2: form.team2,
          herb1: form.herb1 || null,
          herb2: form.herb2 || null,
          dataRozpoczecia: new Date(form.dataRozpoczecia).toISOString(),
        }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error); setSaving(false); return; }
      setSuccess("Typowanie utworzone");
      setTimeout(() => setSuccess(""), 3000);
      setFormOpen(false);
      setForm({ team1: "", team2: "", herb1: "", herb2: "", dataRozpoczecia: "" });
      reload();
    } catch { setError("Błąd połączenia"); }
    setSaving(false);
  }

  async function handleWynik(id) {
    setWynikSaving(true);
    try {
      const r = await fetch(`/api/admin/typowanie/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wynikTeam1: Number(wynikForm.g1), wynikTeam2: Number(wynikForm.g2) }),
      });
      if (r.ok) {
        setWynikId(null);
        setSuccess("Wynik wpisany — punkty obliczone");
        setTimeout(() => setSuccess(""), 3000);
        reload();
      }
    } catch {}
    setWynikSaving(false);
  }

  async function handleDelete(id) {
    if (!confirm("Na pewno usunąć typowanie?")) return;
    await fetch(`/api/admin/typowanie/${id}`, { method: "DELETE" });
    reload();
  }

  async function loadWpisy(id) {
    if (wpisyId === id) { setWpisyId(null); return; }
    setWpisyId(id);
    setWpisyLoading(true);
    try {
      const r = await fetch(`/api/admin/typowanie/${id}/wpisy`);
      setWpisy(await r.json());
    } catch { setWpisy([]); }
    setWpisyLoading(false);
  }

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.05em" }}>
          Typowanie wyników
        </h1>
        <button onClick={() => { setFormOpen(!formOpen); setError(""); }} style={btnPrimary}>
          + Nowe typowanie
        </button>
      </div>

      {success && <div style={{ fontSize: 13, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 7, padding: "9px 13px", marginBottom: 16 }}>{success}</div>}

      {formOpen && (
        <div style={{ ...cardStyle, borderColor: "rgba(59,130,246,0.2)" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 14 }}>Nowe typowanie</div>
          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={lbl}>Drużyna 1 *</label>
                <input style={inp} value={form.team1} onChange={f("team1")} required placeholder="MKS Drawa Drawno" />
              </div>
              <div>
                <label style={lbl}>Drużyna 2 *</label>
                <input style={inp} value={form.team2} onChange={f("team2")} required placeholder="Sokół Karlino" />
              </div>
              <div>
                <label style={lbl}>Herb 1</label>
                <HerbPicker herby={herby} value={form.herb1} onChange={(v) => setForm((p) => ({ ...p, herb1: v }))} />
              </div>
              <div>
                <label style={lbl}>Herb 2</label>
                <HerbPicker herby={herby} value={form.herb2} onChange={(v) => setForm((p) => ({ ...p, herb2: v }))} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>Data i godzina meczu *</label>
                <input style={inp} type="datetime-local" value={form.dataRozpoczecia} onChange={f("dataRozpoczecia")} required />
              </div>
            </div>
            {error && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 10 }}>{error}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button type="submit" disabled={saving} style={btnPrimary}>{saving ? "Tworzenie..." : "Utwórz typowanie"}</button>
              <button type="button" onClick={() => setFormOpen(false)} style={btnGhost}>Anuluj</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ color: "#475569", padding: 40, textAlign: "center" }}>Ładowanie...</div>
      ) : lista.length === 0 ? (
        <div style={{ color: "#475569", padding: 40, textAlign: "center" }}>Brak typowań — utwórz pierwsze.</div>
      ) : (
        lista.map((t) => {
          const st = statusLabel(t);
          const isWynik = wynikId === t.id;
          const isWpisy = wpisyId === t.id;

          return (
            <div key={t.id} style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                  {t.herb1 && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.herb1} alt="" width={28} height={28} style={{ objectFit: "contain", borderRadius: 4, flexShrink: 0 }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                      {t.team1} vs {t.team2}
                    </div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                      {fmtDate(t.dataRozpoczecia)} · {t._count.wpisy} typów
                    </div>
                  </div>
                  {t.herb2 && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.herb2} alt="" width={28} height={28} style={{ objectFit: "contain", borderRadius: 4, flexShrink: 0 }} />
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${st.color}18`, color: st.color, border: `1px solid ${st.color}33` }}>
                    {st.text}
                  </span>

                  {t.wynikTeam1 !== null && (
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>
                      {t.wynikTeam1}:{t.wynikTeam2}
                    </span>
                  )}

                  {t.wynikTeam1 === null && (
                    <button onClick={() => { setWynikId(isWynik ? null : t.id); setWynikForm({ g1: 0, g2: 0 }); }} style={btnSmall}>
                      Wpisz wynik
                    </button>
                  )}

                  <button onClick={() => loadWpisy(t.id)} style={btnSmall}>
                    {isWpisy ? "Ukryj" : "Wpisy"}
                  </button>

                  <button onClick={() => handleDelete(t.id)} style={btnDanger}>Usuń</button>
                </div>
              </div>

              {isWynik && (
                <div style={{ marginTop: 12, padding: "12px 14px", background: "rgba(59,130,246,0.04)", borderRadius: 8, border: "1px solid rgba(59,130,246,0.1)" }}>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8, fontWeight: 600 }}>Wpisz rzeczywisty wynik</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{t.team1}</span>
                    <input type="number" min="0" max="20" value={wynikForm.g1} onChange={(e) => setWynikForm((p) => ({ ...p, g1: e.target.value }))}
                      style={{ ...inp, width: 60, textAlign: "center", fontSize: 18, fontWeight: 700, padding: "6px" }} />
                    <span style={{ color: "#334155", fontSize: 16 }}>:</span>
                    <input type="number" min="0" max="20" value={wynikForm.g2} onChange={(e) => setWynikForm((p) => ({ ...p, g2: e.target.value }))}
                      style={{ ...inp, width: 60, textAlign: "center", fontSize: 18, fontWeight: 700, padding: "6px" }} />
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{t.team2}</span>
                    <button onClick={() => handleWynik(t.id)} disabled={wynikSaving} style={btnPrimary}>
                      {wynikSaving ? "..." : "Zatwierdź"}
                    </button>
                    <button onClick={() => setWynikId(null)} style={btnGhost}>Anuluj</button>
                  </div>
                </div>
              )}

              {isWpisy && (
                <div style={{ marginTop: 12 }}>
                  {wpisyLoading ? (
                    <div style={{ fontSize: 12, color: "#475569" }}>Ładowanie...</div>
                  ) : wpisy.length === 0 ? (
                    <div style={{ fontSize: 12, color: "#475569" }}>Brak wpisów</div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          <th style={{ padding: "6px 8px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>#</th>
                          <th style={{ padding: "6px 8px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Imię i nazwisko</th>
                          <th style={{ padding: "6px 8px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>Typ</th>
                          <th style={{ padding: "6px 8px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>Pkt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wpisy.map((w, i) => (
                          <tr key={w.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                            <td style={{ padding: "6px 8px", color: "#475569" }}>{i + 1}</td>
                            <td style={{ padding: "6px 8px", color: "#cbd5e1" }}>{w.imie} {w.nazwisko}</td>
                            <td style={{ padding: "6px 8px", textAlign: "center", color: "#fff", fontWeight: 600, fontFamily: "monospace" }}>{w.golTeam1}:{w.golTeam2}</td>
                            <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: 700, color: w.punkty !== null ? punktyColor(w.punkty) : "#334155" }}>
                              {w.punkty !== null ? w.punkty : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      <style>{`
        input::placeholder { color: #334155; }
        input:focus { outline: none; border-color: rgba(59,130,246,0.5) !important; }
      `}</style>
    </div>
  );
}
