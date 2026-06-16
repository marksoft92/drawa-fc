"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NowaAnkietaClient() {
  const [tytul, setTytul] = useState("");
  const [pytanie, setPytanie] = useState("");
  const [opcje, setOpcje] = useState(["", ""]);
  const [deadline, setDeadline] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function addOpcja() {
    if (opcje.length < 8) setOpcje((prev) => [...prev, ""]);
  }

  function removeOpcja(i) {
    if (opcje.length <= 2) return;
    setOpcje((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateOpcja(i, val) {
    setOpcje((prev) => prev.map((o, idx) => (idx === i ? val : o)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const filledOpcje = opcje.map((o) => o.trim()).filter(Boolean);
    if (!tytul.trim()) { setError("Tytuł jest wymagany"); return; }
    if (!pytanie.trim()) { setError("Pytanie jest wymagane"); return; }
    if (filledOpcje.length < 2) { setError("Potrzeba min. 2 opcji odpowiedzi"); return; }

    setSending(true);
    try {
      const r = await fetch("/api/panel/ankiety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tytul: tytul.trim(),
          pytanie: pytanie.trim(),
          opcje: filledOpcje,
          deadline: deadline || null,
        }),
      });

      const d = await r.json();
      if (!r.ok) { setError(d.error || "Błąd"); return; }
      router.push("/panel/ankiety/" + d.id);
    } finally {
      setSending(false);
    }
  }

  const minDeadline = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <button onClick={() => router.push("/panel/ankiety")} style={btnBack}>← Ankiety</button>

      <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 24 }}>Nowa ankieta</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={cardStyle}>
          <div style={fieldGroup}>
            <label style={lbl}>Tytuł ankiety</label>
            <input value={tytul} onChange={(e) => setTytul(e.target.value)}
              style={inp} placeholder="np. Wybór stroju na mecz wyjazdowy" maxLength={120} required />
          </div>
          <div style={fieldGroup}>
            <label style={lbl}>Pytanie</label>
            <textarea value={pytanie} onChange={(e) => setPytanie(e.target.value)}
              style={{ ...inp, height: 80, resize: "vertical" }} placeholder="Co myślisz o...?" maxLength={300} required />
          </div>
          <div style={fieldGroup}>
            <label style={lbl}>Termin głosowania (opcjonalny)</label>
            <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              min={minDeadline} style={inp} />
            <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>Bez terminu ankieta trwa do ręcznego zakończenia.</div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: "#475569", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 14 }}>OPCJE ODPOWIEDZI</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {opcje.map((o, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 10, color: "#475569" }}>{i + 1}</span>
                </div>
                <input value={o} onChange={(e) => updateOpcja(i, e.target.value)}
                  style={{ ...inp, flex: 1 }} placeholder={`Opcja ${i + 1}`} maxLength={120} />
                {opcje.length > 2 && (
                  <button type="button" onClick={() => removeOpcja(i)} style={btnRemove}>✕</button>
                )}
              </div>
            ))}
          </div>
          {opcje.length < 8 && (
            <button type="button" onClick={addOpcja} style={btnAdd}>+ Dodaj opcję</button>
          )}
        </div>

        {error && <div style={errStyle}>{error}</div>}

        <button type="submit" disabled={sending} style={{ ...btnPrimary, opacity: sending ? 0.6 : 1 }}>
          {sending ? "Tworzę ankietę..." : "Utwórz i wyślij powiadomienia"}
        </button>
      </form>
    </div>
  );
}

const cardStyle = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "20px 20px" };
const fieldGroup = { marginBottom: 16 };
const lbl = { display: "block", fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 7 };
const inp = { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 14, boxSizing: "border-box", fontFamily: "inherit" };
const btnBack = { background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer", padding: "0 0 18px", display: "block" };
const btnPrimary = { padding: "12px 24px", background: "#3b82f6", border: "none", borderRadius: 9, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" };
const btnAdd = { marginTop: 12, padding: "8px 14px", background: "none", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: 8, color: "#64748b", fontSize: 13, cursor: "pointer", width: "100%" };
const btnRemove = { padding: "6px 10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 6, color: "#ef4444", fontSize: 12, cursor: "pointer", flexShrink: 0 };
const errStyle = { fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "10px 14px" };
