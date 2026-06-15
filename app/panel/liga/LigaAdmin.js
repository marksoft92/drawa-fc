"use client";

import { useState, useEffect } from "react";

// ─── Tab: Tabela ──────────────────────────────────────────────

function TabelaTab({ sezon }) {
  const [tabela, setTabela] = useState([]);
  const [json, setJson] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", err: false });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setTabela([]);
    fetch(`/api/admin/liga/tabela?sezon=${encodeURIComponent(sezon)}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setTabela(Array.isArray(d) ? d : []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [sezon, tick]);

  async function handleImport() {
    setMsg({ text: "", err: false }); setSaving(true);
    try {
      const parsed = JSON.parse(json);
      const arr = Array.isArray(parsed) ? parsed : (parsed.tabela ?? null);
      if (!arr) { setMsg({ text: "JSON musi być tablicą lub obiektem z kluczem 'tabela'", err: true }); return; }
      const r = await fetch("/api/admin/liga/tabela", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sezon, tabela: arr }),
      });
      const d = await r.json();
      if (!r.ok) { setMsg({ text: d.error || "Błąd", err: true }); return; }
      setMsg({ text: `Zaktualizowano tabelę (${d.count} drużyn)`, err: false });
      setJson(""); setTick(t => t + 1);
    } catch (e) { setMsg({ text: `Błąd parsowania JSON: ${e.message}`, err: true }); }
    finally { setSaving(false); }
  }

  const isDrawa = n => n?.toLowerCase().includes("drawa");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={card}>
        <label style={lbl}>WKLEJ JSON TABELI</label>
        <div style={{ fontSize: 11, color: "#334155", marginBottom: 10 }}>
          Tablica obiektów z polami: pozycja, nazwa, herb, pkt, mecze, wygrane, remisy, przegrane, bramki (np. &quot;52:31&quot;), forma
        </div>
        <textarea
          style={{ ...inp, height: 160, fontFamily: "monospace", fontSize: 12, resize: "vertical" }}
          value={json} onChange={e => setJson(e.target.value)}
          placeholder={'[\n  { "pozycja": "1", "nazwa": "Drawa Drawno", "pkt": "52", ... },\n  ...\n]'}
        />
        {msg.text && <div style={{ marginTop: 8, fontSize: 12, color: msg.err ? "#ef4444" : "#22c55e" }}>{msg.text}</div>}
        <button onClick={handleImport} disabled={saving || !json.trim()} style={{ ...btnPrimary, marginTop: 12, opacity: json.trim() ? 1 : 0.5 }}>
          {saving ? "Importuję..." : "Aktualizuj tabelę"}
        </button>
      </div>

      {tabela.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 12 }}>
            Aktualna tabela · {sezon} · {tabela.length} drużyn
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["#", "Drużyna", "M", "W", "R", "P", "Bramki", "Pkt", "Forma"].map(h => (
                    <th key={h} style={{ padding: "6px 8px", color: "#475569", textAlign: h === "Drużyna" ? "left" : "center", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tabela.map(r => (
                  <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: isDrawa(r.nazwa) ? "rgba(59,130,246,0.08)" : "transparent" }}>
                    <td style={{ padding: "6px 8px", color: "#64748b", textAlign: "center" }}>{r.pozycja}</td>
                    <td style={{ padding: "6px 8px", color: isDrawa(r.nazwa) ? "#60a5fa" : "#e2e8f0", fontWeight: isDrawa(r.nazwa) ? 700 : 400 }}>{r.nazwa}</td>
                    <td style={{ padding: "6px 8px", color: "#94a3b8", textAlign: "center" }}>{r.mecze}</td>
                    <td style={{ padding: "6px 8px", color: "#22c55e", textAlign: "center" }}>{r.wygrane}</td>
                    <td style={{ padding: "6px 8px", color: "#94a3b8", textAlign: "center" }}>{r.remisy}</td>
                    <td style={{ padding: "6px 8px", color: "#ef4444", textAlign: "center" }}>{r.przegrane}</td>
                    <td style={{ padding: "6px 8px", color: "#94a3b8", textAlign: "center" }}>{r.bramkiZd}:{r.bramkiStr}</td>
                    <td style={{ padding: "6px 8px", color: "#fff", fontWeight: 700, textAlign: "center" }}>{r.pkt}</td>
                    <td style={{ padding: "6px 8px", textAlign: "center" }}>
                      {(r.forma || "").split("").map((f, i) => (
                        <span key={i} style={{ display: "inline-block", width: 14, height: 14, borderRadius: "50%", background: f === "W" ? "#22c55e" : f === "P" ? "#ef4444" : "#94a3b8", marginRight: 2 }} />
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Edytor przebieg meczu ────────────────────────────────────

function MeczEditor({ mecz, onSave, onClose }) {
  const [form, setForm] = useState({
    score: mecz.score || "",
    status: mecz.status || "koniec",
    komentarz: mecz.komentarz || "",
    walkower: mecz.walkower || false,
    strzelcyJson: JSON.stringify(mecz.strzelcy || [], null, 2),
    kartkiJson: JSON.stringify(mecz.kartki || [], null, 2),
    zmianyJson: JSON.stringify(mecz.zmiany || [], null, 2),
    date: mecz.date || "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function handleSave() {
    setErr(""); setSaving(true);
    let strzelcy, kartki, zmiany;
    try { strzelcy = JSON.parse(form.strzelcyJson || "[]"); } catch { setErr("Błąd JSON strzelcy"); setSaving(false); return; }
    try { kartki = JSON.parse(form.kartkiJson || "[]"); } catch { setErr("Błąd JSON kartki"); setSaving(false); return; }
    try { zmiany = JSON.parse(form.zmianyJson || "[]"); } catch { setErr("Błąd JSON zmiany"); setSaving(false); return; }
    const r = await fetch(`/api/admin/liga/mecze/${mecz.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: form.score, status: form.status, komentarz: form.komentarz, walkower: form.walkower, strzelcy, kartki, zmiany, date: form.date }),
    });
    if (!r.ok) { const d = await r.json(); setErr(d.error || "Błąd"); setSaving(false); return; }
    setSaving(false);
    onSave();
  }

  const isDrawa = n => n?.toLowerCase().includes("drawa");

  return (
    <div style={{ background: "rgba(59,130,246,0.04)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 10, padding: 16, marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#93c5fd" }}>
          {isDrawa(mecz.team1) ? <b style={{ color: "#60a5fa" }}>{mecz.team1}</b> : mecz.team1}
          {" vs "}
          {isDrawa(mecz.team2) ? <b style={{ color: "#60a5fa" }}>{mecz.team2}</b> : mecz.team2}
        </div>
        <button onClick={onClose} style={{ ...btnGhost, padding: "3px 10px", fontSize: 12 }}>✕ Zamknij</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div>
          <label style={lbl}>WYNIK</label>
          <input style={inp} value={form.score} onChange={e => setForm(p => ({ ...p, score: e.target.value }))} placeholder="2:1" />
        </div>
        <div>
          <label style={lbl}>STATUS</label>
          <select style={{ ...inp, cursor: "pointer" }} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
            <option value="koniec">Zakończony</option>
            <option value="planowany">Planowany</option>
            <option value="walkower">Walkower</option>
            <option value="live">Na żywo</option>
          </select>
        </div>
        <div>
          <label style={lbl}>DATA / GODZINA</label>
          <input style={inp} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} placeholder="15 cze 16:00" />
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={lbl}>KOMENTARZ</label>
        <input style={inp} value={form.komentarz} onChange={e => setForm(p => ({ ...p, komentarz: e.target.value }))} placeholder="(walkower), opis meczu..." />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
        {[
          { key: "strzelcyJson", label: "STRZELCY / ZDARZENIA (JSON)" },
          { key: "kartkiJson",   label: "KARTKI (JSON)" },
          { key: "zmianyJson",   label: "ZMIANY (JSON)" },
        ].map(({ key, label }) => (
          <div key={key}>
            <label style={lbl}>{label}</label>
            <textarea
              style={{ ...inp, height: 140, fontFamily: "monospace", fontSize: 11, resize: "vertical" }}
              value={form[key]}
              onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
              placeholder="[]"
            />
          </div>
        ))}
      </div>

      {err && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 8 }}>{err}</div>}
      <button onClick={handleSave} disabled={saving} style={btnPrimary}>{saving ? "Zapisuję..." : "Zapisz przebieg"}</button>
    </div>
  );
}

// ─── Tab: Terminarz ───────────────────────────────────────────

function TerminarzTab({ sezon }) {
  const [mecze, setMecze] = useState([]);
  const [json, setJson] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", err: false });
  const [openId, setOpenId] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setMecze([]);
    fetch(`/api/admin/liga/mecze?sezon=${encodeURIComponent(sezon)}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setMecze(Array.isArray(d) ? d : []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [sezon, tick]);

  async function handleImport() {
    setMsg({ text: "", err: false }); setSaving(true);
    try {
      const parsed = JSON.parse(json);
      const arr = Array.isArray(parsed) ? parsed : (parsed.mecze ?? null);
      if (!arr) { setMsg({ text: "JSON musi być tablicą lub obiektem z kluczem 'mecze'", err: true }); return; }
      const r = await fetch("/api/admin/liga/mecze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sezon, mecze: arr }),
      });
      const d = await r.json();
      if (!r.ok) { setMsg({ text: d.error || "Błąd", err: true }); return; }
      setMsg({ text: `Zaimportowano ${d.upserted} meczów`, err: false });
      setJson(""); setTick(t => t + 1);
    } catch (e) { setMsg({ text: `Błąd parsowania JSON: ${e.message}`, err: true }); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Usunąć ten mecz?")) return;
    await fetch(`/api/admin/liga/mecze/${id}`, { method: "DELETE" });
    setTick(t => t + 1);
  }

  const isDrawa = n => n?.toLowerCase().includes("drawa");
  const rozegrane = mecze.filter(m => m.score || m.walkower);
  const planowane = mecze.filter(m => !m.score && !m.walkower);

  function MeczRow({ m }) {
    const drawaTeam = isDrawa(m.team1) ? m.team2 : m.team1;
    const home = isDrawa(m.team1);
    return (
      <div style={{ marginBottom: 4 }}>
        <div style={{ ...card, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>
              {home ? (
                <><span style={{ color: "#60a5fa", fontWeight: 700 }}>Drawa</span> vs {drawaTeam}</>
              ) : (
                <>{drawaTeam} vs <span style={{ color: "#60a5fa", fontWeight: 700 }}>Drawa</span></>
              )}
              {m.score && <span style={{ marginLeft: 10, fontFamily: "monospace", color: "#fff", fontWeight: 700 }}>{m.score}</span>}
              {m.walkower && <span style={{ marginLeft: 6, fontSize: 10, color: "#f59e0b" }}>W.O.</span>}
            </div>
            <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>{m.date}{m.liga ? ` · ${m.liga}` : ""}</div>
          </div>
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <button onClick={() => setOpenId(openId === m.id ? null : m.id)} style={{ ...btnRowAction, color: openId === m.id ? "#60a5fa" : "#64748b", borderColor: openId === m.id ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.08)" }}>
              {openId === m.id ? "Zamknij" : "Edytuj przebieg"}
            </button>
            <button onClick={() => handleDelete(m.id)} style={{ ...btnRowAction, color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" }}>✕</button>
          </div>
        </div>
        {openId === m.id && (
          <MeczEditor mecz={m} onSave={() => { setTick(t => t + 1); setOpenId(null); }} onClose={() => setOpenId(null)} />
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={card}>
        <label style={lbl}>WKLEJ JSON TERMINARZ / MECZE</label>
        <div style={{ fontSize: 11, color: "#334155", marginBottom: 10 }}>
          Tablica obiektów z polami: team1, team2, score, date, status, walkower, strzelcy, kartki, zmiany. Duplikaty (team1+team2+date) są aktualizowane.
        </div>
        <textarea
          style={{ ...inp, height: 160, fontFamily: "monospace", fontSize: 12, resize: "vertical" }}
          value={json} onChange={e => setJson(e.target.value)}
          placeholder={'[\n  { "team1": "Drawa Drawno", "team2": "Orzeł Żeńsko", "score": "3:1", "date": "15 cze 16:00", "status": "koniec" },\n  ...\n]'}
        />
        {msg.text && <div style={{ marginTop: 8, fontSize: 12, color: msg.err ? "#ef4444" : "#22c55e" }}>{msg.text}</div>}
        <button onClick={handleImport} disabled={saving || !json.trim()} style={{ ...btnPrimary, marginTop: 12, opacity: json.trim() ? 1 : 0.5 }}>
          {saving ? "Importuję..." : "Importuj mecze"}
        </button>
      </div>

      {mecze.length > 0 && (
        <>
          {rozegrane.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>ROZEGRANE ({rozegrane.length})</div>
              {rozegrane.map(m => <MeczRow key={m.id} m={m} />)}
            </div>
          )}
          {planowane.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>ZAPLANOWANE ({planowane.length})</div>
              {planowane.map(m => <MeczRow key={m.id} m={m} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Główny komponent ─────────────────────────────────────────

export default function LigaAdmin() {
  const [tab, setTab] = useState("tabela");
  const [sezon, setSezon] = useState("");
  const [nowySezon, setNowySezon] = useState("");
  const [sezonyList, setSezonyList] = useState([]);
  const [aktywnySezon, setAktywnySezon] = useState("");
  const [settingMsg, setSettingMsg] = useState({ text: "", err: false });
  const [settingSaving, setSettingSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/liga/sezony").then(r => r.json()).then(d => {
      if (Array.isArray(d) && d.length > 0) setSezonyList(d);
    }).catch(() => {});
    fetch("/api/ustawienia").then(r => r.json()).then(u => {
      const aktywny = u.aktywny_sezon || "2025/26";
      setAktywnySezon(aktywny);
      setSezon(aktywny);
    }).catch(() => { setSezon("2025/26"); setAktywnySezon("2025/26"); });
  }, []);

  const aktualnySezon = nowySezon.trim() || sezon;

  async function handleSetAktywny() {
    if (!aktualnySezon) return;
    setSettingMsg({ text: "", err: false }); setSettingSaving(true);
    const r = await fetch("/api/admin/ustawienia", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aktywny_sezon: aktualnySezon }),
    });
    setSettingSaving(false);
    if (r.ok) {
      setAktywnySezon(aktualnySezon);
      setSettingMsg({ text: `Aktywny sezon ustawiony na: ${aktualnySezon}`, err: false });
      if (!sezonyList.includes(aktualnySezon)) setSezonyList(prev => [aktualnySezon, ...prev]);
    } else {
      setSettingMsg({ text: "Błąd zapisu", err: true });
    }
  }

  if (!aktualnySezon) return <div style={{ color: "#475569", padding: 20 }}>Ładowanie...</div>;

  return (
    <div>
      <div style={{ fontSize: "clamp(20px,4vw,28px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff", marginBottom: 8 }}>
        Liga
      </div>

      {/* Selektor sezonu */}
      <div style={{ ...card, marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 180px" }}>
          <label style={lbl}>SEZON</label>
          <select style={{ ...inp, cursor: "pointer" }} value={sezon} onChange={e => { setSezon(e.target.value); setNowySezon(""); }}>
            {sezonyList.map(s => (
              <option key={s} value={s}>{s}{s === aktywnySezon ? " ★ aktywny" : ""}</option>
            ))}
            {sezonyList.length === 0 && <option value="2025/26">2025/26</option>}
          </select>
        </div>
        <div style={{ flex: "1 1 180px" }}>
          <label style={lbl}>LUB WPISZ NOWY SEZON</label>
          <input
            style={inp} value={nowySezon}
            onChange={e => setNowySezon(e.target.value)}
            placeholder="np. 2026/27"
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <button
            onClick={handleSetAktywny}
            disabled={settingSaving || !aktualnySezon || aktualnySezon === aktywnySezon}
            style={{ ...btnPrimary, opacity: (!aktualnySezon || aktualnySezon === aktywnySezon) ? 0.4 : 1, whiteSpace: "nowrap" }}
          >
            {settingSaving ? "Zapisuję..." : aktualnySezon === aktywnySezon ? "★ Aktywny na stronie" : "Ustaw jako aktywny"}
          </button>
          {settingMsg.text && <div style={{ fontSize: 11, color: settingMsg.err ? "#ef4444" : "#22c55e" }}>{settingMsg.text}</div>}
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#475569", marginBottom: 16 }}>
        Edytujesz: <span style={{ color: "#fff", fontWeight: 600 }}>{aktualnySezon}</span>
        {aktualnySezon === aktywnySezon
          ? <span style={{ marginLeft: 8, color: "#22c55e" }}>★ widoczny na stronie głównej</span>
          : <span style={{ marginLeft: 8, color: "#f59e0b" }}>· nie jest aktywny — strona pokazuje {aktywnySezon}</span>}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { id: "tabela", label: "Tabela ligowa" },
          { id: "terminarz", label: "Terminarz i przebieg" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "10px 18px", background: "none", border: "none", borderBottom: tab === t.id ? "2px solid #3b82f6" : "2px solid transparent", color: tab === t.id ? "#3b82f6" : "#475569", fontSize: 13, fontWeight: tab === t.id ? 600 : 400, cursor: "pointer", marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "tabela"
        ? <TabelaTab key={aktualnySezon + "-tabela"} sezon={aktualnySezon} />
        : <TerminarzTab key={aktualnySezon + "-terminarz"} sezon={aktualnySezon} />}

      <style>{`input:focus,textarea:focus,select:focus{outline:none;border-color:rgba(59,130,246,0.5)!important}*{box-sizing:border-box}`}</style>
    </div>
  );
}

const card = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "20px" };
const lbl = { display: "block", fontSize: 10, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 6 };
const inp = { width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#fff", fontSize: 13 };
const btnPrimary = { padding: "9px 18px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnGhost = { padding: "9px 14px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#64748b", fontSize: 13, cursor: "pointer" };
const btnRowAction = { padding: "4px 9px", background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#64748b", fontSize: 11, cursor: "pointer" };
