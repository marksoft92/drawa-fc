"use client";

import { useState, useEffect } from "react";

const ROLES = [
  { value: "PLAYER", label: "Piłkarz" },
  { value: "STAFF", label: "Sztab" },
  { value: "ADMIN", label: "Admin" },
];

const POSITIONS = ["Bramkarz", "Obrońca", "Pomocnik", "Napastnik", ""];

const STAT_FIELDS = [
  { key: "mecze",       label: "Mecze (liga)" },
  { key: "gole",        label: "Gole (liga)" },
  { key: "asysty",      label: "Asysty" },
  { key: "zolte",       label: "Żółte" },
  { key: "czerwone",    label: "Czerwone" },
  { key: "meczePuchar", label: "Mecze (puchar)" },
  { key: "golePuchar",  label: "Gole (puchar)" },
];

const emptyUserForm = {
  login: "", email: "", password: "", role: "PLAYER",
  imieNazwisko: "", pozycja: "", numer: "", dataUrodzenia: "",
};

const emptyStats = () => Object.fromEntries(STAT_FIELDS.map((f) => [f.key, 0]));

export default function PanelGracze() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyUserForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetPwId, setResetPwId] = useState(null);
  const [resetPw, setResetPw] = useState("");

  // stats panel state
  const [statsUserId, setStatsUserId] = useState(null);
  const [statsSezony, setStatsSezony] = useState([]);
  const [statsAllData, setStatsAllData] = useState([]);
  const [statsSezonId, setStatsSezonId] = useState("");
  const [statsForm, setStatsForm] = useState(emptyStats());
  const [statsSaving, setStatsSaving] = useState(false);
  const [statsSuccess, setStatsSuccess] = useState("");
  const [statsError, setStatsError] = useState("");
  const [statsLoading, setStatsLoading] = useState(false);

  const [tick, setTick] = useState(0);
  const load = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/gracze")
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setUsers(Array.isArray(d) ? d : []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tick]);

  function openCreate() {
    setEditId(null);
    setForm(emptyUserForm);
    setError("");
    setFormOpen(true);
    setStatsUserId(null);
  }

  function openEdit(u) {
    setEditId(u.id);
    setForm({
      login: u.login,
      email: u.email || "",
      password: "",
      role: u.role,
      imieNazwisko: u.player?.imieNazwisko || "",
      pozycja: u.player?.pozycja || "",
      numer: u.player?.numer?.toString() || "",
      dataUrodzenia: u.player?.dataUrodzenia
        ? new Date(u.player.dataUrodzenia).toISOString().split("T")[0]
        : "",
    });
    setError("");
    setFormOpen(true);
    setStatsUserId(null);
  }

  async function openStats(u) {
    if (statsUserId === u.id) { setStatsUserId(null); return; }
    setStatsUserId(u.id);
    setStatsSuccess(""); setStatsError("");
    setStatsLoading(true);
    setStatsForm(emptyStats());
    try {
      const r = await fetch(`/api/admin/gracze/${u.id}/stats`);
      const d = await r.json();
      setStatsSezony(d.sezony ?? []);
      setStatsAllData(d.stats ?? []);
      const aktywny = d.sezony?.find((s) => s.aktywny);
      const firstSezonId = aktywny?.id ?? d.sezony?.[0]?.id ?? "";
      setStatsSezonId(firstSezonId);
      if (firstSezonId) {
        const existing = (d.stats ?? []).find((s) => s.sezonId === firstSezonId);
        const vals = emptyStats();
        if (existing) STAT_FIELDS.forEach((f) => { vals[f.key] = existing[f.key] ?? 0; });
        setStatsForm(vals);
      }
    } catch { setStatsError("Błąd połączenia"); }
    finally { setStatsLoading(false); }
  }

  function onSezonChange(sezonId) {
    setStatsSezonId(sezonId);
    const existing = statsAllData.find((s) => s.sezonId === sezonId);
    const vals = emptyStats();
    if (existing) STAT_FIELDS.forEach((f) => { vals[f.key] = existing[f.key] ?? 0; });
    setStatsForm(vals);
  }

  async function saveStats() {
    if (!statsSezonId || !statsUserId) return;
    setStatsSaving(true); setStatsError(""); setStatsSuccess("");
    try {
      const r = await fetch(`/api/admin/gracze/${statsUserId}/stats`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sezonId: statsSezonId, ...statsForm }),
      });
      const d = await r.json();
      if (r.ok) {
        setStatsSuccess("Zapisano");
        setStatsAllData((prev) => {
          const idx = prev.findIndex((s) => s.sezonId === statsSezonId);
          if (idx >= 0) return prev.map((s, i) => i === idx ? { ...s, ...d.stats } : s);
          return [...prev, d.stats];
        });
        setTimeout(() => setStatsSuccess(""), 2500);
      } else {
        setStatsError(d.error || "Błąd");
      }
    } catch { setStatsError("Błąd połączenia"); }
    finally { setStatsSaving(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = editId ? `/api/admin/gracze/${editId}` : "/api/admin/gracze";
      const method = editId ? "PATCH" : "POST";
      const body = { ...form };
      if (editId && !body.password) delete body.password;
      if (body.password && editId) body.newPassword = body.password;

      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Błąd"); setSaving(false); return; }

      setSuccess(editId ? "Zapisano zmiany" : "Konto utworzone");
      setTimeout(() => setSuccess(""), 3000);
      setFormOpen(false);
      load();
    } catch {
      setError("Błąd połączenia");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u) {
    await fetch(`/api/admin/gracze/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    load();
  }

  async function handleResetPw(id) {
    if (!resetPw || resetPw.length < 6) { setError("Min. 6 znaków"); return; }
    setSaving(true);
    const r = await fetch(`/api/admin/gracze/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: resetPw, mustChangePassword: true }),
    });
    if (r.ok) {
      setSuccess("Hasło zmienione — użytkownik będzie musiał je ustawić przy logowaniu");
      setTimeout(() => setSuccess(""), 4000);
    }
    setResetPwId(null);
    setResetPw("");
    setSaving(false);
  }

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: "clamp(20px,4vw,28px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>
            Gracze
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{users.length} kont</div>
        </div>
        <button onClick={openCreate} style={btnPrimary}>+ Dodaj gracza</button>
      </div>

      {success && <div style={alertSuccess}>{success}</div>}

      {formOpen && (
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12, padding: "22px 22px", marginBottom: 24,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
              {editId ? "Edytuj konto" : "Nowe konto"}
            </div>
            <button onClick={() => setFormOpen(false)} style={btnGhost}>✕</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
              <div>
                <label style={lbl}>Imię i nazwisko *</label>
                <input style={inp} value={form.imieNazwisko} onChange={f("imieNazwisko")} required placeholder="Jan Kowalski" />
              </div>
              <div>
                <label style={lbl}>Login *</label>
                <input
                  style={inp}
                  value={form.login} onChange={f("login")} required
                  placeholder="jkowalski"
                />
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input style={inp} type="email" value={form.email} onChange={f("email")} placeholder="jan@email.pl" />
              </div>
              <div>
                <label style={lbl}>{editId ? "Nowe hasło (zostaw puste)" : "Hasło *"}</label>
                <input style={inp} type="password" value={form.password} onChange={f("password")}
                  required={!editId} placeholder="••••••" />
              </div>
              <div>
                <label style={lbl}>Rola</label>
                <select style={inp} value={form.role} onChange={f("role")}>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Pozycja</label>
                <select style={inp} value={form.pozycja} onChange={f("pozycja")}>
                  <option value="">—</option>
                  {POSITIONS.filter(Boolean).map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Numer koszulki</label>
                <input style={inp} type="number" min="1" max="99" value={form.numer} onChange={f("numer")} placeholder="10" />
              </div>
              <div>
                <label style={lbl}>Data urodzenia</label>
                <input style={inp} type="date" value={form.dataUrodzenia} onChange={f("dataUrodzenia")} />
              </div>
            </div>

            {error && <div style={{ ...alertErr, marginTop: 14 }}>{error}</div>}

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button type="submit" disabled={saving} style={btnPrimary}>
                {saving ? "Zapisuję..." : editId ? "Zapisz zmiany" : "Utwórz konto"}
              </button>
              <button type="button" onClick={() => setFormOpen(false)} style={btnGhost}>Anuluj</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ color: "#475569", fontSize: 14, padding: 20 }}>Ładowanie...</div>
      ) : users.length === 0 ? (
        <div style={{ color: "#475569", fontSize: 14, padding: 20, textAlign: "center" }}>
          Brak kont. Dodaj pierwszego gracza.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Zawodnik", "Login", "Rola", "Pozycja", "Nr", "Status", "Akcje"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#475569", fontWeight: 600, fontSize: 11, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <>
                  <tr
                    key={u.id}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "10px 12px", color: "#fff", fontWeight: 500 }}>
                      {u.player?.imieNazwisko || "—"}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#64748b", fontFamily: "monospace" }}>
                      {u.login}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                        background: u.role === "ADMIN" ? "rgba(239,68,68,0.1)" : u.role === "STAFF" ? "rgba(251,191,36,0.1)" : "rgba(59,130,246,0.1)",
                        color: u.role === "ADMIN" ? "#ef4444" : u.role === "STAFF" ? "#fbbf24" : "#3b82f6",
                        border: `1px solid ${u.role === "ADMIN" ? "rgba(239,68,68,0.25)" : u.role === "STAFF" ? "rgba(251,191,36,0.25)" : "rgba(59,130,246,0.25)"}`,
                      }}>
                        {ROLES.find((r) => r.value === u.role)?.label}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#64748b" }}>{u.player?.pozycja || "—"}</td>
                    <td style={{ padding: "10px 12px", color: "#64748b" }}>{u.player?.numer || "—"}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <button onClick={() => toggleActive(u)} style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, cursor: "pointer",
                        background: u.active ? "rgba(34,197,94,0.08)" : "rgba(100,116,139,0.08)",
                        color: u.active ? "#22c55e" : "#475569",
                        border: `1px solid ${u.active ? "rgba(34,197,94,0.2)" : "rgba(100,116,139,0.2)"}`,
                      }}>
                        {u.active ? "Aktywny" : "Nieaktywny"}
                      </button>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openEdit(u)} style={btnRowAction}>Edytuj</button>
                        <button
                          onClick={() => { setResetPwId(resetPwId === u.id ? null : u.id); setResetPw(""); setError(""); setStatsUserId(null); }}
                          style={btnRowAction}
                        >
                          Hasło
                        </button>
                        {u.player && (
                          <button
                            onClick={() => { setResetPwId(null); openStats(u); }}
                            style={{ ...btnRowAction, color: statsUserId === u.id ? "#3b82f6" : "#64748b", borderColor: statsUserId === u.id ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.08)" }}
                          >
                            Staty
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {resetPwId === u.id && (
                    <tr key={`${u.id}-pw`} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)" }}>
                      <td colSpan={7} style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, color: "#64748b" }}>Nowe hasło tymczasowe dla {u.login}:</span>
                          <input
                            type="password" value={resetPw} onChange={(e) => setResetPw(e.target.value)}
                            placeholder="min. 6 znaków" style={{ ...inp, width: 180, padding: "6px 10px", fontSize: 12 }}
                          />
                          <button onClick={() => handleResetPw(u.id)} disabled={saving} style={{ ...btnPrimary, padding: "6px 14px", fontSize: 12 }}>
                            Zmień
                          </button>
                          <button onClick={() => setResetPwId(null)} style={{ ...btnGhost, padding: "6px 12px", fontSize: 12 }}>
                            Anuluj
                          </button>
                          {error && <span style={{ fontSize: 12, color: "#ef4444" }}>{error}</span>}
                        </div>
                      </td>
                    </tr>
                  )}
                  {statsUserId === u.id && (
                    <tr key={`${u.id}-stats`} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(59,130,246,0.03)" }}>
                      <td colSpan={7} style={{ padding: "14px 16px" }}>
                        {statsLoading ? (
                          <span style={{ fontSize: 12, color: "#475569" }}>Ładowanie...</span>
                        ) : statsSezony.length === 0 ? (
                          <span style={{ fontSize: 12, color: "#475569" }}>Brak sezonów — utwórz sezon w zakładce Sezony.</span>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em" }}>SEZON</span>
                              <select
                                value={statsSezonId}
                                onChange={(e) => onSezonChange(e.target.value)}
                                style={{ ...inp, width: "auto", minWidth: 120, padding: "5px 10px", fontSize: 12 }}
                              >
                                {statsSezony.map((s) => (
                                  <option key={s.id} value={s.id}>{s.nazwa}{s.aktywny ? " ★" : ""}</option>
                                ))}
                              </select>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 8 }}>
                              {STAT_FIELDS.map(({ key, label }) => (
                                <div key={key}>
                                  <label style={{ ...lbl, fontSize: 10 }}>{label.toUpperCase()}</label>
                                  <input
                                    type="number" min="0"
                                    value={statsForm[key] ?? 0}
                                    onChange={(e) => setStatsForm((f) => ({ ...f, [key]: e.target.value }))}
                                    style={{ ...inp, padding: "6px 10px", fontSize: 14, fontWeight: 700 }}
                                  />
                                </div>
                              ))}
                            </div>

                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <button onClick={saveStats} disabled={statsSaving || !statsSezonId} style={{ ...btnPrimary, padding: "6px 16px", fontSize: 12 }}>
                                {statsSaving ? "Zapisuję..." : "Zapisz staty"}
                              </button>
                              <button onClick={() => setStatsUserId(null)} style={{ ...btnGhost, padding: "6px 12px", fontSize: 12 }}>
                                Zamknij
                              </button>
                              {statsSuccess && <span style={{ fontSize: 12, color: "#22c55e" }}>{statsSuccess}</span>}
                              {statsError && <span style={{ fontSize: 12, color: "#ef4444" }}>{statsError}</span>}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        select option { background: #0f172a; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.4); }
        input::placeholder { color: #334155; }
        input:focus, select:focus { outline: none; border-color: rgba(59,130,246,0.5) !important; background: rgba(15,23,42,0.8) !important; }
      `}</style>
    </div>
  );
}

const lbl = { display: "block", fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 6 };
const inp = { width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#fff", fontSize: 13, transition: "border-color 0.2s" };
const btnPrimary = { padding: "9px 18px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnGhost = { padding: "9px 14px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#64748b", fontSize: 13, cursor: "pointer" };
const btnRowAction = { padding: "4px 10px", background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#64748b", fontSize: 11, cursor: "pointer" };
const alertSuccess = { fontSize: 13, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 7, padding: "9px 13px", marginBottom: 16 };
const alertErr = { fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "9px 13px" };
