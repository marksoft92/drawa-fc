"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PushManager from "./PushManager";

export default function AnkietyClient({ userId, role, canCreate }) {
  const [ankiety, setAnkiety] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/panel/ankiety")
      .then((r) => r.json())
      .then(setAnkiety)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    if (!confirm("Usunąć tę ankietę?")) return;
    await fetch("/api/panel/ankiety/" + id, { method: "DELETE" });
    setAnkiety((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleToggle(id, aktywna) {
    await fetch("/api/panel/ankiety/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aktywna: !aktywna }),
    });
    setAnkiety((prev) => prev.map((a) => a.id === id ? { ...a, aktywna: !aktywna } : a));
  }

  if (loading) return <div style={centerStyle}><div style={spinStyle} /></div>;

  const aktywne = ankiety.filter((a) => a.aktywna);
  const zakonczone = ankiety.filter((a) => !a.aktywna);

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={h1Style}>Ankiety</h1>
          <p style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
            {aktywne.length} aktywnych · {zakonczone.length} zakończonych
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <PushManager />
          {canCreate && (
            <Link href="/panel/ankiety/nowa" style={btnPrimary}>+ Nowa ankieta</Link>
          )}
        </div>
      </div>

      {ankiety.length === 0 && (
        <div style={emptyCard}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 15, color: "#94a3b8" }}>Brak ankiet</div>
          {canCreate && <p style={{ fontSize: 13, color: "#475569", marginTop: 8 }}>Utwórz pierwszą ankietę dla drużyny.</p>}
        </div>
      )}

      {aktywne.length > 0 && (
        <>
          <div style={sectionLabel}>Aktywne</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
            {aktywne.map((a) => (
              <AnkietaKarta key={a.id} a={a} canCreate={canCreate} onDelete={handleDelete} onToggle={handleToggle} />
            ))}
          </div>
        </>
      )}

      {zakonczone.length > 0 && (
        <>
          <div style={sectionLabel}>Zakończone</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {zakonczone.map((a) => (
              <AnkietaKarta key={a.id} a={a} canCreate={canCreate} onDelete={handleDelete} onToggle={handleToggle} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AnkietaKarta({ a, canCreate, onDelete, onToggle }) {
  const deadline = a.deadline ? new Date(a.deadline) : null;
  const voted = !!a.mojGlos;
  const winnerOpcja = !a.aktywna && a.opcje.length > 0
    ? a.opcje.reduce((best, o) => o.liczbaGlosow > best.liczbaGlosow ? o : best, a.opcje[0])
    : null;

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ ...badgeStyle, background: a.aktywna ? "rgba(34,197,94,0.1)" : "rgba(100,116,139,0.1)", color: a.aktywna ? "#22c55e" : "#64748b", border: `1px solid ${a.aktywna ? "rgba(34,197,94,0.2)" : "rgba(100,116,139,0.15)"}` }}>
              {a.aktywna ? "Aktywna" : "Zakończona"}
            </span>
            {voted && (
              <span style={{ ...badgeStyle, background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}>
                ✓ Zagłosowałeś
              </span>
            )}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{a.tytul}</div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>{a.pytanie}</div>
          <div style={{ fontSize: 11, color: "#475569" }}>
            {a.totalGlosy} {a.totalGlosy === 1 ? "głos" : "głosów"}
            {deadline && (
              <> · do {deadline.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</>
            )}
          </div>
          {winnerOpcja && winnerOpcja.liczbaGlosow > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#fbbf24" }}>
              Zwycięzca: <strong>{winnerOpcja.tresc}</strong> ({winnerOpcja.liczbaGlosow} głosów)
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
          <Link href={"/panel/ankiety/" + a.id} style={btnDetail}>
            {a.aktywna && !voted ? "Głosuj" : "Wyniki"}
          </Link>
          {canCreate && (
            <>
              <button onClick={() => onToggle(a.id, a.aktywna)} style={btnSmall}>
                {a.aktywna ? "Zakończ" : "Wznów"}
              </button>
              <button onClick={() => onDelete(a.id)} style={{ ...btnSmall, color: "#ef4444" }}>Usuń</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const h1Style = { fontSize: 22, fontWeight: 700, color: "#fff" };
const sectionLabel = { fontSize: 11, color: "#475569", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 10 };
const centerStyle = { display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 };
const spinStyle = { width: 28, height: 28, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.7s linear infinite" };
const cardStyle = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 18px" };
const emptyCard = { ...cardStyle, textAlign: "center", padding: "40px 24px" };
const btnPrimary = { padding: "9px 18px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none", display: "inline-block" };
const btnDetail = { padding: "7px 14px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 7, color: "#3b82f6", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "none", textAlign: "center", whiteSpace: "nowrap" };
const btnSmall = { padding: "5px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#64748b", fontSize: 11, cursor: "pointer" };
const badgeStyle = { fontSize: 10, fontWeight: 600, padding: "3px 7px", borderRadius: 5, letterSpacing: "0.04em" };
