"use client";
import { useState, useEffect, useRef } from "react";

const isDrawa = n => n?.toLowerCase().includes("drawa");

// ─── Ikony zdarzeń ────────────────────────────────────────────

function typIcon(typ) {
  if (typ === "gol") return "⚽";
  if (typ === "samobójczy") return "⚽🔴";
  if (typ === "żółta kartka") return "🟨";
  if (typ === "czerwona kartka") return "🟥";
  if (typ === "żółto-czerwona") return "🟨🟥";
  if (typ === "zmiana") return "🔄";
  return "·";
}

// ─── Zdarzenia meczu ──────────────────────────────────────────

function Zdarzenia({ zdarzenia, team1, team2 }) {
  if (!zdarzenia?.length) return <div style={{ color: "#334155", fontSize: 11, padding: "8px 0" }}>Brak zdarzeń</div>;
  const drawaStrona = isDrawa(team1) ? "gospodarze" : "goscie";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {zdarzenia.map((z, i) => {
        const nasza = z.strona === drawaStrona;
        const isGoal = z.typ === "gol" || z.typ === "samobójczy";
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
            <span style={{ width: 30, fontSize: 10, color: "#475569", textAlign: "right", flexShrink: 0 }}>{z.minuta}&apos;</span>
            <span style={{ fontSize: 13 }}>{typIcon(z.typ)}</span>
            <span style={{
              fontSize: 12,
              color: nasza ? (isGoal ? "#4ade80" : "#93c5fd") : "#94a3b8",
              fontWeight: nasza && isGoal ? 700 : 400,
              flex: 1,
            }}>
              {z.zawodnik || "—"}
            </span>
            <span style={{ fontSize: 10, color: "#334155", flexShrink: 0 }}>
              {z.strona === "gospodarze" ? team1?.split(" ")[0] : team2?.split(" ")[0]}
            </span>
            {z.wynik_po && <span style={{ fontSize: 10, color: "#475569", fontFamily: "monospace", flexShrink: 0 }}>{z.wynik_po}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Wiersz meczu ─────────────────────────────────────────────

function MeczRow({ mecz, index, edits, onEdit }) {
  const [open, setOpen] = useState(false);
  const home = isDrawa(mecz.team1);
  const opp = home ? mecz.team2 : mecz.team1;
  const isWalkower = mecz.walkower || mecz.status === "walkower";
  const isPlanowany = !mecz.score && !isWalkower;
  const goale = (mecz.wszystkieZdarzenia || []).filter(z => z.typ === "gol" || z.typ === "samobójczy");
  const kartki = (mecz.wszystkieZdarzenia || []).filter(z => z.typ.includes("kartka") || z.typ.includes("żółto"));
  const sklady = mecz.sklady;
  const drawaSklad = sklady ? (home ? sklady.gospodarze : sklady.goscie) : null;
  const edit = edits[index] || {};

  const score = edit.score !== undefined ? edit.score : (mecz.score || "");
  const status = edit.status !== undefined ? edit.status : (mecz.status || "koniec");
  const date = edit.date !== undefined ? edit.date : (mecz.date || "");

  return (
    <div style={{ marginBottom: 4 }}>
      <div
        style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10,
          padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
        }}
        onClick={() => setOpen(o => !o)}
      >
        {/* Score / Status */}
        <div style={{ width: 56, textAlign: "center", flexShrink: 0 }}>
          {isWalkower ? (
            <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700 }}>W.O.</span>
          ) : isPlanowany ? (
            <span style={{ fontSize: 10, color: "#475569" }}>—</span>
          ) : (
            <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "#fff" }}>{score || "?:?"}</span>
          )}
        </div>

        {/* Teams */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0" }}>
            {home ? <><span style={{ color: "#60a5fa", fontWeight: 700 }}>Drawa</span> vs {opp}</> : <>{opp} vs <span style={{ color: "#60a5fa", fontWeight: 700 }}>Drawa</span></>}
          </div>
          <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>
            {date}
            {mecz.liga ? ` · ${mecz.liga}` : ""}
            {goale.length > 0 && ` · ${goale.length} goli`}
            {kartki.length > 0 && ` · ${kartki.length} kartek`}
            {drawaSklad && ` · skład: ${drawaSklad.pierwsza11?.length || 0}+${drawaSklad.rezerwa?.length || 0}`}
          </div>
        </div>

        {/* Status badge */}
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
          color: isPlanowany ? "#94a3b8" : isWalkower ? "#f59e0b" : "#22c55e",
          flexShrink: 0,
        }}>
          {isPlanowany ? "PLAN" : isWalkower ? "W.O." : "OK"}
        </span>
        <span style={{ color: "#334155", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{ background: "rgba(59,130,246,0.03)", border: "1px solid rgba(59,130,246,0.1)", borderTop: "none", borderRadius: "0 0 10px 10px", padding: 14 }}>
          {/* Editable fields */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 8, marginBottom: 14 }}>
            <div>
              <label style={lbl}>WYNIK</label>
              <input style={inp} value={score} onChange={e => onEdit(index, "score", e.target.value)} placeholder="2:1" onClick={e => e.stopPropagation()} />
            </div>
            <div>
              <label style={lbl}>STATUS</label>
              <select style={{ ...inp, cursor: "pointer" }} value={status} onChange={e => onEdit(index, "status", e.target.value)} onClick={e => e.stopPropagation()}>
                <option value="koniec">Zakończony</option>
                <option value="planowany">Planowany</option>
                <option value="walkower">Walkower</option>
              </select>
            </div>
            <div>
              <label style={lbl}>DATA</label>
              <input style={inp} value={date} onChange={e => onEdit(index, "date", e.target.value)} placeholder="15 cze 16:00" onClick={e => e.stopPropagation()} />
            </div>
          </div>

          {/* Zdarzenia */}
          {(mecz.wszystkieZdarzenia?.length > 0) && (
            <div style={{ marginBottom: 12 }}>
              <div style={lbl}>PRZEBIEG MECZU ({mecz.wszystkieZdarzenia.length} zdarzeń)</div>
              <Zdarzenia zdarzenia={mecz.wszystkieZdarzenia} team1={mecz.team1} team2={mecz.team2} />
            </div>
          )}

          {/* Skład Drawy */}
          {drawaSklad && (
            <div>
              <div style={lbl}>SKŁAD DRAWY · Pierwsza 11</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {drawaSklad.pierwsza11?.map((p, i) => (
                  <span key={i} style={{
                    fontSize: 11, padding: "2px 8px",
                    background: p.gole_w_meczu > 0 ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${p.gole_w_meczu > 0 ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 4, color: p.gole_w_meczu > 0 ? "#4ade80" : "#94a3b8",
                  }}>
                    {p.numer ? `#${p.numer} ` : ""}{p.nazwisko}
                    {p.gole_w_meczu > 0 ? ` ⚽×${p.gole_w_meczu}` : ""}
                    {p.kartka_w_meczu === "żółta" ? " 🟨" : ""}
                    {p.kartka_w_meczu === "czerwona" ? " 🟥" : ""}
                  </span>
                ))}
              </div>
              {drawaSklad.rezerwa?.length > 0 && (
                <>
                  <div style={{ ...lbl, marginTop: 8 }}>ŁAWKA</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {drawaSklad.rezerwa.map((p, i) => (
                      <span key={i} style={{
                        fontSize: 11, padding: "2px 8px",
                        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 4, color: "#475569",
                        opacity: p.zmiana_w_meczu === "wszedł" || p.zmiana_w_meczu === "wszedł_i_zszedł" ? 1 : 0.5,
                      }}>
                        {p.numer ? `#${p.numer} ` : ""}{p.nazwisko}
                        {(p.zmiana_w_meczu === "wszedł" || p.zmiana_w_meczu === "wszedł_i_zszedł") ? " 🔄" : ""}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── JSON Tab ─────────────────────────────────────────────────

function JsonSection({ title, json, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);
  const text = JSON.stringify(json, null, 2);
  function copy() {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <button onClick={() => setOpen(o => !o)} style={{ ...btnGhost, fontSize: 12, padding: "5px 10px" }}>
          {open ? "▲" : "▼"} {title}
        </button>
        <button onClick={copy} style={{ ...btnGhost, fontSize: 11, padding: "5px 10px", color: copied ? "#22c55e" : "#64748b" }}>
          {copied ? "✓ Skopiowano!" : "Kopiuj JSON"}
        </button>
        <span style={{ fontSize: 11, color: "#334155" }}>{Array.isArray(json) ? `${json.length} wpisów` : ""}</span>
      </div>
      {open && (
        <pre style={{
          background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8,
          padding: 14, fontSize: 10, color: "#94a3b8", overflowX: "auto", maxHeight: 400,
          fontFamily: "monospace", whiteSpace: "pre", lineHeight: 1.5,
        }}>
          {text}
        </pre>
      )}
    </div>
  );
}

function JsonTab({ data }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "#475569", marginBottom: 16 }}>
        Raw JSON do skopiowania lub wklejenia ręcznie. Dane są identyczne z tym co zostanie zapisane do bazy.
      </div>
      <JsonSection title="Tabela ligowa" json={data.tabela} defaultOpen />
      {(data.mecze || []).filter(m => m.score || m.walkower).length > 0 && (
        <JsonSection title={`Mecze rozegrane (${(data.mecze || []).filter(m => m.score || m.walkower).length})`} json={(data.mecze || []).filter(m => m.score || m.walkower)} defaultOpen={false} />
      )}
      {(data.mecze || []).filter(m => !m.score && !m.walkower).length > 0 && (
        <JsonSection title={`Mecze planowane (${(data.mecze || []).filter(m => !m.score && !m.walkower).length})`} json={(data.mecze || []).filter(m => !m.score && !m.walkower)} defaultOpen={false} />
      )}
      <JsonSection title="Wszystkie mecze" json={data.mecze} defaultOpen={false} />
    </div>
  );
}

// ─── Główny komponent ─────────────────────────────────────────

export default function ScraperAdmin() {
  const [status, setStatus] = useState({ status: "idle", progress: null, startedAt: null, finishedAt: null, stats: null });
  const [data, setData] = useState(null);
  const [source, setSource] = useState("regiowyniki");
  const [sezon, setSezon] = useState("2025/26");
  const [tab, setTab] = useState("tabela");
  const [edits, setEdits] = useState({});
  const [importing, setImporting] = useState(null);
  const [importMsg, setImportMsg] = useState({ text: "", err: false });
  const pollRef = useRef(null);

  const load = () => {
    fetch("/api/admin/scraper").then(r => r.json()).then(d => {
      setStatus({ status: d.status, progress: d.progress, startedAt: d.startedAt, finishedAt: d.finishedAt, stats: d.stats });
      if (d.source) setSource(d.source);
      if (d.data) setData(d.data);
    }).catch(() => {});
  };

  useEffect(() => {
    load();
    fetch("/api/ustawienia").then(r => r.json()).then(u => { if (u.aktywny_sezon) setSezon(u.aktywny_sezon); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (status.status === "running" || status.status === "queued") {
      pollRef.current = setInterval(load, 3000);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [status.status]);

  async function handleRun() {
    setImportMsg({ text: "", err: false });
    const r = await fetch("/api/admin/scraper", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source }),
    });
    if (r.ok) { setStatus(s => ({ ...s, status: "queued", progress: "Oczekiwanie na agenta..." })); }
    else { const d = await r.json(); setImportMsg({ text: d.error || "Błąd", err: true }); }
  }

  async function handleReset() {
    await fetch("/api/admin/scraper", { method: "DELETE" });
    setStatus({ status: "idle", progress: null, startedAt: null, finishedAt: null, stats: null });
    setImportMsg({ text: "", err: false });
  }

  function handleEdit(index, field, value) {
    setEdits(prev => ({ ...prev, [index]: { ...prev[index], [field]: value } }));
  }

  // Merge edits into mecze before importing
  function getMeczeWithEdits() {
    if (!data?.mecze) return [];
    return data.mecze.map((m, i) => {
      const e = edits[i] || {};
      return {
        ...m,
        score: e.score !== undefined ? (e.score || null) : m.score,
        status: e.status !== undefined ? e.status : m.status,
        date: e.date !== undefined ? e.date : m.date,
      };
    });
  }

  async function handleImportTabela() {
    if (!data?.tabela) return;
    setImporting("tabela"); setImportMsg({ text: "", err: false });
    const r = await fetch("/api/admin/liga/tabela", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sezon, tabela: data.tabela }),
    });
    const d = await r.json();
    setImporting(null);
    setImportMsg(r.ok ? { text: `✓ Zaimportowano tabelę (${d.count} drużyn) → sezon ${sezon}`, err: false } : { text: d.error || "Błąd", err: true });
  }

  async function handleImportMecze() {
    if (!data?.mecze) return;
    setImporting("mecze"); setImportMsg({ text: "", err: false });
    const mecze = getMeczeWithEdits();
    const r = await fetch("/api/admin/liga/mecze", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sezon, mecze }),
    });
    const d = await r.json();
    setImporting(null);
    setImportMsg(r.ok ? { text: `✓ Zaimportowano ${d.upserted} meczów → sezon ${sezon}`, err: false } : { text: d.error || "Błąd", err: true });
  }

  async function handleImportAll() {
    await handleImportTabela();
    await handleImportMecze();
  }

  const isQueued = status.status === "queued";
  const isRunning = status.status === "running";
  const isDone = status.status === "done";
  const isIdle = status.status === "idle";
  const hasData = !!data;
  const rozegrane = (data?.mecze || []).filter(m => m.score || m.walkower);
  const planowane = (data?.mecze || []).filter(m => !m.score && !m.walkower);

  // Elapsed time
  let elapsed = "";
  if (status.startedAt) {
    const start = new Date(status.startedAt);
    const end = status.finishedAt ? new Date(status.finishedAt) : new Date();
    const sec = Math.floor((end - start) / 1000);
    elapsed = sec > 60 ? `${Math.floor(sec/60)}m ${sec%60}s` : `${sec}s`;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ fontSize: "clamp(20px,4vw,28px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff", marginBottom: 4 }}>
        Scraper · {source === "zzpn" ? "ZZPN" : "RegioWyniki"}
      </div>
      <div style={{ fontSize: 12, color: "#475569", marginBottom: 20 }}>
        Pobierz dane z {source === "zzpn" ? "rozgrywki.zzpn.pl" : "regiowyniki.pl"} i zaimportuj do bazy. Serwer nie łączy się z {source === "zzpn" ? "zzpn.pl" : "regiowyniki.pl"} sam (blokada Cloudflare na składy) —
        zlecenie odbiera i wykonuje lokalny agent (<code style={{ color: "#64748b" }}>node scripts/agent.cjs</code>), który musi działać na Twoim komputerze.
      </div>

      {/* Status + Controls */}
      <div style={{ ...card, marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
        {/* Status dot */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: isRunning ? "#f59e0b" : isQueued ? "#3b82f6" : isDone ? "#22c55e" : "#334155",
            boxShadow: isRunning ? "0 0 8px #f59e0b" : isQueued ? "0 0 8px #3b82f6" : "none",
            animation: (isRunning || isQueued) ? "pulse 1.5s ease-in-out infinite" : "none",
          }} />
          <span style={{ fontSize: 12, color: isRunning ? "#f59e0b" : isQueued ? "#3b82f6" : isDone ? "#22c55e" : "#475569", fontWeight: 600 }}>
            {isRunning ? `Scrapuję... (${elapsed})` : isQueued ? "Oczekiwanie na agenta..." : isDone ? `Pobrano ${status.finishedAt?.slice(0,10)} (${elapsed})` : "Gotowy"}
          </span>
          {status.progress && <span style={{ fontSize: 11, color: "#334155" }}>· {status.progress}</span>}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto", flexWrap: "wrap" }}>
          {/* Źródło */}
          <div>
            <label style={{ ...lbl, display: "inline", marginRight: 6 }}>Źródło:</label>
            <select
              style={{ ...inp, width: 140, display: "inline", cursor: (isRunning || isQueued) ? "not-allowed" : "pointer" }}
              value={source}
              onChange={e => setSource(e.target.value)}
              disabled={isRunning || isQueued}
            >
              <option value="regiowyniki">RegioWyniki.pl</option>
              <option value="zzpn">ZZPN (terminarz)</option>
            </select>
          </div>

          {/* Sezon */}
          <div>
            <label style={{ ...lbl, display: "inline", marginRight: 6 }}>Sezon:</label>
            <input style={{ ...inp, width: 90, display: "inline" }} value={sezon} onChange={e => setSezon(e.target.value)} />
          </div>

          {/* Buttons */}
          {!isRunning && !isQueued && (
            <button onClick={handleRun} style={btnPrimary}>
              ▶ Uruchom scraper
            </button>
          )}
          {(isDone || isQueued || status.status === "error") && (
            <button onClick={handleReset} style={btnGhost}>Resetuj</button>
          )}
          {hasData && !isRunning && !isQueued && (
            <button onClick={handleImportAll} disabled={!!importing} style={{ ...btnPrimary, background: "#22c55e" }}>
              {importing ? "Importuję..." : `↓ Importuj wszystko → ${sezon}`}
            </button>
          )}
        </div>

        {importMsg.text && (
          <div style={{ width: "100%", fontSize: 12, color: importMsg.err ? "#ef4444" : "#22c55e", marginTop: 4 }}>
            {importMsg.text}
          </div>
        )}
      </div>

      {/* Waiting for agent to pick up the job */}
      {isQueued && (
        <div style={{ ...card, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>🕓</div>
          <div style={{ fontSize: 13, color: "#475569" }}>Zlecenie czeka w kolejce.</div>
          <div style={{ fontSize: 11, color: "#334155", marginTop: 8 }}>
            Uruchom na swoim komputerze: <code style={{ color: "#64748b" }}>node scripts/agent.cjs</code> — agent sam wykryje zlecenie i zacznie scrapować.
          </div>
        </div>
      )}

      {/* Loading spinner while running */}
      {isRunning && !hasData && (
        <div style={{ ...card, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 13, color: "#475569" }}>Agent pracuje... może to potrwać kilka minut.</div>
          <div style={{ fontSize: 11, color: "#334155", marginTop: 8 }}>{status.progress}</div>
        </div>
      )}

      {/* No data yet */}
      {isIdle && !hasData && (
        <div style={{ ...card, textAlign: "center", padding: 48, color: "#334155" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📡</div>
          <div style={{ fontSize: 13 }}>Kliknij "Uruchom scraper" aby zlecić pobranie aktualnych danych z regiowyniki.pl</div>
        </div>
      )}

      {/* Data preview */}
      {hasData && (
        <>
          {/* Stats summary */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { v: data.tabela?.length || 0, l: "DRUŻYN W TABELI" },
              { v: data.mecze?.length || 0, l: "MECZÓW" },
              { v: rozegrane.length, l: "ROZEGRANYCH" },
              { v: planowane.length, l: "PLANOWANYCH" },
              { v: (data.mecze || []).filter(m => m.wszystkieZdarzenia?.length > 0).length, l: "Z PRZEBIEGIEM" },
              { v: (data.mecze || []).filter(m => m.sklady).length, l: "ZE SKŁADAMI" },
            ].map(({ v, l }) => (
              <div key={l} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 16px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Bebas Neue',Impact,sans-serif", fontSize: 26, color: "#3b82f6" }}>{v}</div>
                <div style={{ fontSize: 9, color: "#334155", letterSpacing: "0.1em", marginTop: 2 }}>{l}</div>
              </div>
            ))}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#334155" }}>Pobrano</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{data.scraped_at?.slice(0, 16).replace("T", " ")}</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              { id: "tabela", label: `Tabela (${data.tabela?.length || 0})` },
              { id: "mecze", label: `Mecze (${data.mecze?.length || 0})` },
              { id: "json", label: "JSON" },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "10px 18px", background: "none", border: "none",
                borderBottom: tab === t.id ? "2px solid #3b82f6" : "2px solid transparent",
                color: tab === t.id ? "#3b82f6" : "#475569",
                fontSize: 13, fontWeight: tab === t.id ? 600 : 400, cursor: "pointer", marginBottom: -1,
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tabela tab */}
          {tab === "tabela" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "#475569" }}>Tabela ligowa · {data.tabela?.length} drużyn</div>
                <button onClick={handleImportTabela} disabled={importing === "tabela"} style={btnPrimary}>
                  {importing === "tabela" ? "Importuję..." : `↓ Importuj tabelę → ${sezon}`}
                </button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      {["#", "Drużyna", "M", "W", "R", "P", "Bramki", "Pkt", "Forma"].map(h => (
                        <th key={h} style={{ padding: "8px 10px", color: "#475569", textAlign: h === "Drużyna" ? "left" : "center", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data.tabela || []).map((r, i) => (
                      <tr key={i} style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: isDrawa(r.nazwa) ? "rgba(59,130,246,0.08)" : "transparent",
                      }}>
                        <td style={{ padding: "8px 10px", color: "#64748b", textAlign: "center" }}>{r.pozycja}</td>
                        <td style={{ padding: "8px 10px", color: isDrawa(r.nazwa) ? "#60a5fa" : "#e2e8f0", fontWeight: isDrawa(r.nazwa) ? 700 : 400 }}>
                          {r.nazwa}
                          {isDrawa(r.nazwa) && <span style={{ marginLeft: 6, fontSize: 10, color: "#3b82f6" }}>★</span>}
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "center", color: "#94a3b8" }}>{r.mecze}</td>
                        <td style={{ padding: "8px 10px", textAlign: "center", color: "#22c55e" }}>{r.wygrane}</td>
                        <td style={{ padding: "8px 10px", textAlign: "center", color: "#94a3b8" }}>{r.remisy}</td>
                        <td style={{ padding: "8px 10px", textAlign: "center", color: "#ef4444" }}>{r.przegrane}</td>
                        <td style={{ padding: "8px 10px", textAlign: "center", color: "#94a3b8", fontFamily: "monospace" }}>{r.bramki}</td>
                        <td style={{ padding: "8px 10px", textAlign: "center", color: "#fff", fontWeight: 700 }}>{r.pkt}</td>
                        <td style={{ padding: "8px 10px", textAlign: "center" }}>
                          {(r.forma || "").split("").map((f, j) => (
                            <span key={j} style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", marginRight: 2, background: f === "W" ? "#22c55e" : f === "P" ? "#ef4444" : "#94a3b8" }} />
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mecze tab */}
          {tab === "mecze" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "#475569" }}>Kliknij mecz aby zobaczyć szczegóły i edytować przed importem</div>
                <button onClick={handleImportMecze} disabled={importing === "mecze"} style={btnPrimary}>
                  {importing === "mecze" ? "Importuję..." : `↓ Importuj mecze → ${sezon}`}
                </button>
              </div>

              {rozegrane.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", marginBottom: 8 }}>
                    ROZEGRANE ({rozegrane.length})
                  </div>
                  {(data.mecze || []).map((m, i) => (m.score || m.walkower) && (
                    <MeczRow key={i} mecz={m} index={i} edits={edits} onEdit={handleEdit} />
                  ))}
                </div>
              )}

              {planowane.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", marginBottom: 8 }}>
                    PLANOWANE ({planowane.length})
                  </div>
                  {(data.mecze || []).map((m, i) => (!m.score && !m.walkower) && (
                    <MeczRow key={i} mecz={m} index={i} edits={edits} onEdit={handleEdit} />
                  ))}
                </div>
              )}
            </div>
          )}
          {/* JSON tab */}
          {tab === "json" && hasData && (
            <JsonTab data={data} />
          )}
        </>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        input:focus,select:focus{outline:none;border-color:rgba(59,130,246,0.5)!important}
        *{box-sizing:border-box}
      `}</style>
    </div>
  );
}

const card = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 20px" };
const lbl = { display: "block", fontSize: 10, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 5 };
const inp = { width: "100%", padding: "8px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#fff", fontSize: 13 };
const btnPrimary = { padding: "9px 16px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" };
const btnGhost = { padding: "9px 14px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#64748b", fontSize: 13, cursor: "pointer" };
