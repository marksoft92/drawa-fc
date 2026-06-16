"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AnkietaDetailClient({ ankietaId, userId, canManage }) {
  const [ankieta, setAnkieta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wybranaOpcja, setWybranaOpcja] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/panel/ankiety/" + ankietaId)
      .then((r) => r.json())
      .then((d) => { setAnkieta(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ankietaId]);

  async function glosuj() {
    if (!wybranaOpcja) return;
    setSending(true);
    setError("");
    try {
      const r = await fetch("/api/panel/ankiety/" + ankietaId + "/glos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opcjaId: wybranaOpcja }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Błąd"); return; }

      const updated = await fetch("/api/panel/ankiety/" + ankietaId).then((r) => r.json());
      setAnkieta(updated);
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div style={centerStyle}><div style={spinStyle} /></div>;
  if (!ankieta || ankieta.error) return (
    <div style={{ textAlign: "center", padding: 40 }}>
      <div style={{ color: "#ef4444" }}>Nie znaleziono ankiety</div>
      <button onClick={() => router.push("/panel/ankiety")} style={{ ...btnBack, marginTop: 16 }}>← Wróć</button>
    </div>
  );

  const totalGlosy = ankieta.totalGlosy;
  const mojGlos = ankieta.mojGlos;
  const showResults = !!mojGlos || !ankieta.aktywna;
  const deadline = ankieta.deadline ? new Date(ankieta.deadline) : null;

  const winnerOpcja = !ankieta.aktywna && ankieta.opcje.length > 0
    ? ankieta.opcje.reduce((best, o) => o.liczbaGlosow > best.liczbaGlosow ? o : best, ankieta.opcje[0])
    : null;

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <button onClick={() => router.push("/panel/ankiety")} style={btnBack}>← Ankiety</button>

      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ ...badge, background: ankieta.aktywna ? "rgba(34,197,94,0.1)" : "rgba(100,116,139,0.1)", color: ankieta.aktywna ? "#22c55e" : "#64748b", border: `1px solid ${ankieta.aktywna ? "rgba(34,197,94,0.2)" : "rgba(100,116,139,0.15)"}` }}>
            {ankieta.aktywna ? "Aktywna" : "Zakończona"}
          </span>
          {mojGlos && <span style={{ ...badge, background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}>✓ Zagłosowałeś</span>}
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{ankieta.tytul}</h1>
        <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 6 }}>{ankieta.pytanie}</p>

        <div style={{ fontSize: 12, color: "#475569", marginBottom: 20, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <span>Autor: {ankieta.creatorName}</span>
          {deadline && <span>Do: {deadline.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>}
          <span>{totalGlosy} {totalGlosy === 1 ? "głos" : totalGlosy < 5 ? "głosy" : "głosów"}</span>
        </div>

        {winnerOpcja && winnerOpcja.liczbaGlosow > 0 && (
          <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700, marginBottom: 4, letterSpacing: "0.06em" }}>ZWYCIĘSKA OPCJA</div>
            <div style={{ fontSize: 15, color: "#fbbf24", fontWeight: 600 }}>{winnerOpcja.tresc}</div>
            <div style={{ fontSize: 12, color: "#92400e", marginTop: 2 }}>
              {winnerOpcja.liczbaGlosow} z {totalGlosy} głosów ({totalGlosy > 0 ? Math.round((winnerOpcja.liczbaGlosow / totalGlosy) * 100) : 0}%)
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ankieta.opcje.map((o) => {
            const pct = totalGlosy > 0 ? Math.round((o.liczbaGlosow / totalGlosy) * 100) : 0;
            const isMyVote = mojGlos === o.id;
            const isSelected = wybranaOpcja === o.id;

            if (showResults) {
              return (
                <div key={o.id} style={{
                  border: `1px solid ${isMyVote ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: 10, overflow: "hidden",
                  background: isMyVote ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0.02)",
                }}>
                  <div style={{ padding: "12px 14px", position: "relative" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: pct + "%", background: isMyVote ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.03)", borderRadius: 10, transition: "width 0.5s" }} />
                    <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {isMyVote && <span style={{ fontSize: 12, color: "#3b82f6" }}>✓</span>}
                        <span style={{ fontSize: 14, color: "#e2e8f0" }}>{o.tresc}</span>
                      </div>
                      <div style={{ fontSize: 13, color: "#94a3b8", flexShrink: 0, marginLeft: 12 }}>
                        {pct}% ({o.liczbaGlosow})
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <button key={o.id} onClick={() => setWybranaOpcja(o.id)} style={{
                textAlign: "left", padding: "12px 14px",
                background: isSelected ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${isSelected ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 10, cursor: "pointer", color: "#e2e8f0", fontSize: 14,
                transition: "all 0.15s", display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${isSelected ? "#3b82f6" : "rgba(255,255,255,0.2)"}`,
                  background: isSelected ? "#3b82f6" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isSelected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                </div>
                {o.tresc}
              </button>
            );
          })}
        </div>

        {!showResults && ankieta.aktywna && (
          <div style={{ marginTop: 20 }}>
            {error && <div style={errStyle}>{error}</div>}
            <button onClick={glosuj} disabled={!wybranaOpcja || sending} style={{
              ...btnVote, opacity: (!wybranaOpcja || sending) ? 0.5 : 1,
              cursor: (!wybranaOpcja || sending) ? "not-allowed" : "pointer",
            }}>
              {sending ? "Zapisuję..." : "Oddaj głos"}
            </button>
          </div>
        )}

        {!ankieta.aktywna && !ankieta.mojGlos && totalGlosy === 0 && (
          <div style={{ marginTop: 16, fontSize: 13, color: "#475569", textAlign: "center" }}>Nikt nie zagłosował.</div>
        )}
      </div>

      {ankieta.glosujacy && ankieta.glosujacy.length > 0 && (
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <div style={{ fontSize: 12, color: "#475569", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 14 }}>KARTA GŁOSOWANIA</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ankieta.glosujacy.map((g, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: 13, color: "#e2e8f0" }}>{g.name}</span>
                <span style={{ fontSize: 12, color: "#3b82f6" }}>{g.opcjaTresc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const cardStyle = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 22px" };
const centerStyle = { display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 };
const spinStyle = { width: 28, height: 28, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.7s linear infinite" };
const btnBack = { background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer", padding: "0 0 18px", display: "block" };
const btnVote = { padding: "11px 24px", background: "#3b82f6", border: "none", borderRadius: 9, color: "#fff", fontSize: 14, fontWeight: 600, width: "100%" };
const badge = { fontSize: 10, fontWeight: 600, padding: "3px 7px", borderRadius: 5, letterSpacing: "0.04em" };
const errStyle = { fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "9px 13px", marginBottom: 10 };
