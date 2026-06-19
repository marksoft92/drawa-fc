"use client";

import { useState, useEffect } from "react";

const card = { background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20 };
const inp = { width: "100%", background: "#1e293b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#fff", fontSize: 13, padding: "8px 12px" };
const lbl = { fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#475569", marginBottom: 6, display: "block" };
const btnPrimary = { padding: "10px 24px", borderRadius: 8, background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.4)", color: "#3b82f6", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", cursor: "pointer" };
const btnGhost = { padding: "8px 16px", borderRadius: 6, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontSize: 12, cursor: "pointer" };

function slugify(str) {
  return str.toLowerCase()
    .replace(/ą/g,"a").replace(/ć/g,"c").replace(/ę/g,"e").replace(/ł/g,"l")
    .replace(/ń/g,"n").replace(/ó/g,"o").replace(/ś/g,"s").replace(/ź/g,"z").replace(/ż/g,"z")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const emptyForm = () => ({ tytul: "", slug: "", tresc: "", metaOpis: "", published: true });

export default function StronyAdmin() {
  const [strony, setStrony] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    fetch("/api/admin/strony").then(r => r.json()).then(d => setStrony(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, [tick]);

  function openCreate() { setEditId(null); setForm(emptyForm()); setError(""); setSuccess(""); setView("form"); }

  async function openEdit(id) {
    const r = await fetch(`/api/admin/strony/${id}`);
    const d = await r.json();
    setEditId(id);
    setForm({ tytul: d.tytul, slug: d.slug, tresc: d.tresc, metaOpis: d.metaOpis || "", published: d.published });
    setError(""); setSuccess(""); setView("form");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      const url = editId ? `/api/admin/strony/${editId}` : "/api/admin/strony";
      const r = await fetch(url, { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Błąd"); setSaving(false); return; }
      setSuccess(editId ? "Zapisano" : "Strona utworzona");
      setTick(t => t + 1); setView("list");
    } catch { setError("Błąd połączenia"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Usunąć stronę?")) return;
    await fetch(`/api/admin/strony/${id}`, { method: "DELETE" });
    setTick(t => t + 1);
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  if (view === "form") return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ fontSize: "clamp(20px,4vw,28px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff", marginBottom: 16 }}>
        {editId ? "Edytuj stronę" : "Nowa strona"}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={card}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={lbl}>TYTUŁ</label>
              <input style={inp} value={form.tytul} onChange={e => { const t = e.target.value; setForm(p => ({ ...p, tytul: t, slug: editId ? p.slug : slugify(t) })); }} placeholder="np. Historia klubu" />
            </div>
            <div>
              <label style={lbl}>SLUG (URL)</label>
              <input style={inp} value={form.slug} onChange={f("slug")} placeholder="historia-klubu" />
              <div style={{ fontSize: 10, color: "#334155", marginTop: 4 }}>mksdrawadrawno.pl/s/{form.slug || "..."}</div>
            </div>
          </div>
        </div>

        <div style={card}>
          <label style={lbl}>META OPIS (SEO, max 160 znaków)</label>
          <textarea style={{ ...inp, height: 60, resize: "vertical" }} value={form.metaOpis} onChange={f("metaOpis")} placeholder="Krótki opis strony widoczny w Google..." />
          <div style={{ fontSize: 10, color: form.metaOpis.length > 160 ? "#ef4444" : "#334155", marginTop: 4 }}>{form.metaOpis.length}/160</div>
        </div>

        {form.tytul && (
          <div style={{ ...card, background: "rgba(255,255,255,0.03)" }}>
            <label style={lbl}>PODGLĄD W GOOGLE</label>
            <div style={{ fontFamily: "Arial, sans-serif", maxWidth: 600 }}>
              <div style={{ fontSize: 18, color: "#8ab4f8", lineHeight: 1.3, marginBottom: 4 }}>{form.tytul} | MKS Drawa Drawno</div>
              <div style={{ fontSize: 12, color: "#bdc1c6", marginBottom: 4 }}>mksdrawadrawno.pl › s › {form.slug || "..."}</div>
              <div style={{ fontSize: 13, color: "#9aa0a6", lineHeight: 1.5 }}>{form.metaOpis || "Brak opisu."}</div>
            </div>
          </div>
        )}

        <div style={card}>
          <label style={lbl}>TREŚĆ (akapity oddziel pustą linią)</label>
          <textarea style={{ ...inp, height: 300, resize: "vertical", fontFamily: "monospace", fontSize: 13, lineHeight: 1.6 }} value={form.tresc} onChange={f("tresc")} placeholder="Treść strony..." />
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "#94a3b8" }}>
          <input type="checkbox" checked={form.published} onChange={e => setForm(p => ({ ...p, published: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "#3b82f6" }} />
          Opublikowana
        </label>

        {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 16px", color: "#ef4444", fontSize: 13 }}>{error}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={saving} style={btnPrimary}>{saving ? "Zapisuję..." : editId ? "Zapisz" : "Utwórz stronę"}</button>
          <button type="button" onClick={() => setView("list")} style={btnGhost}>Anuluj</button>
        </div>
      </form>
      <style>{`input:focus, textarea:focus { outline: none; border-color: rgba(59,130,246,0.5) !important; }`}</style>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: "clamp(20px,4vw,28px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>Strony</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{strony.length} stron · np. historia, regulamin</div>
        </div>
        <button onClick={openCreate} style={btnPrimary}>+ Nowa strona</button>
      </div>

      {success && <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "10px 16px", color: "#22c55e", fontSize: 13, marginBottom: 16 }}>{success}</div>}

      {loading ? (
        <div style={{ color: "#475569", fontSize: 13 }}>Ładowanie...</div>
      ) : strony.length === 0 ? (
        <div style={{ color: "#475569", fontSize: 13, padding: 20, textAlign: "center" }}>Brak stron. Utwórz pierwszą — np. "Historia klubu".</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {strony.map(s => (
            <div key={s.id} style={{ ...card, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: s.published ? "#fff" : "#475569" }}>{s.tytul}</div>
                <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>/s/{s.slug}</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <a href={`/s/${s.slug}`} target="_blank" rel="noopener noreferrer" style={{ ...btnGhost, fontSize: 10, padding: "4px 10px", textDecoration: "none" }}>Podgląd</a>
                <button onClick={() => openEdit(s.id)} style={{ ...btnGhost, fontSize: 10, padding: "4px 10px" }}>Edytuj</button>
                <button onClick={() => handleDelete(s.id)} style={{ ...btnGhost, fontSize: 10, padding: "4px 10px", color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}>Usuń</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
