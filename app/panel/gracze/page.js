"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

const ROLES = [
  { value: "PLAYER", label: "Piłkarz" },
  { value: "STAFF", label: "Sztab" },
  { value: "ADMIN", label: "Admin" },
];

const POSITIONS = ["Bramkarz", "Obrońca", "Pomocnik", "Napastnik"];

const UPRAWNIENIA_OPTIONS = [
  { slug: "aktualnosci", label: "Aktualności" },
  { slug: "galeria", label: "Galeria" },
  { slug: "wideo", label: "Wideo" },
  { slug: "strony", label: "Strony" },
  { slug: "komentarze", label: "Komentarze" },
  { slug: "typowanie", label: "Typowanie" },
  { slug: "liga", label: "Liga" },
  { slug: "sponsorzy", label: "Sponsorzy" },
  { slug: "struktura", label: "Struktura" },
  { slug: "kontakt", label: "Kontakt" },
  { slug: "newsletter", label: "Newsletter" },
  { slug: "transmisja", label: "Transmisja" },
  { slug: "sezony", label: "Sezony" },
  { slug: "koszty", label: "Koszty" },
  { slug: "sklep", label: "Sklep" },
];

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
  uprawnienia: [],
};

const emptyStats = () => Object.fromEntries(STAT_FIELDS.map((f) => [f.key, 0]));

function timeAgo(date) {
  if (!date) return null;
  const mins = Math.floor((Date.now() - new Date(date)) / 60000);
  if (mins < 1) return "teraz";
  if (mins < 60) return `${mins} min temu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} godz. temu`;
  return `${Math.floor(hrs / 24)} dni temu`;
}

function isOnline(lastSeen) {
  if (!lastSeen) return false;
  return (Date.now() - new Date(lastSeen)) / 60000 < 5;
}

// Kody typów z Health Connect (ExerciseSessionRecord.exerciseType)
const EXERCISE_TYPE_LABELS = {
  0: "Trening (inny)",
  8: "Rower",
  57: "Bieganie",
  65: "Piłka nożna",
  70: "Siłownia",
  79: "Marsz",
  81: "Podnoszenie ciężarów",
};

function exerciseLabel(type) {
  return EXERCISE_TYPE_LABELS[type] ?? `Trening (typ ${type})`;
}

function formatExerciseWhen(startTime) {
  const d = new Date(startTime);
  const dateStr = d.toLocaleDateString("pl-PL", { timeZone: "Europe/Warsaw", day: "2-digit", month: "2-digit" });
  const timeStr = d.toLocaleTimeString("pl-PL", { timeZone: "Europe/Warsaw", hour: "2-digit", minute: "2-digit" });
  return `${dateStr}, ${timeStr}`;
}

function formatDuration(seconds) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} godz. ${mins % 60} min`;
}

function Avatar({ foto, name, size = 38 }) {
  const [err, setErr] = useState(false);
  const initials = (name || "?").charAt(0).toUpperCase();

  if (foto && !err) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "1.5px solid rgba(255,255,255,0.1)" }}>
        <Image
          src={foto} alt={name || "avatar"} width={size} height={size}
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
          onError={() => setErr(true)}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: "rgba(59,130,246,0.15)",
      border: "1.5px solid rgba(59,130,246,0.25)", display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * 0.4, fontWeight: 700, color: "#3b82f6",
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

export default function PanelGracze() {
  const [data, setData] = useState({ users: [], currentRole: null, currentUserId: null });
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  // Admin form state
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyUserForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetPwId, setResetPwId] = useState(null);
  const [resetPw, setResetPw] = useState("");

  // Stats panel
  const [statsUserId, setStatsUserId] = useState(null);
  const [statsSezony, setStatsSezony] = useState([]);
  const [statsAllData, setStatsAllData] = useState([]);
  const [statsSezonId, setStatsSezonId] = useState("");
  const [statsForm, setStatsForm] = useState(emptyStats());
  const [statsSaving, setStatsSaving] = useState(false);
  const [statsSuccess, setStatsSuccess] = useState("");
  const [statsError, setStatsError] = useState("");
  const [statsLoading, setStatsLoading] = useState(false);

  // Health/band tokens
  const [healthUserId, setHealthUserId] = useState(null);
  const [healthToken, setHealthToken] = useState(null);
  const [healthToday, setHealthToday] = useState(null);
  const [healthExercises, setHealthExercises] = useState([]);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthGenerating, setHealthGenerating] = useState(false);
  const [healthCopied, setHealthCopied] = useState(false);

  // Kadra per sezon
  const [aktywnySezon, setAktywnySezon] = useState(null);
  const [kadraPlayerIds, setKadraPlayerIds] = useState(new Set());
  const [kadraToggling, setKadraToggling] = useState(null);

  const load = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/panel/gracze")
      .then((r) => r.json())
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    fetch("/api/admin/sezony")
      .then(r => r.json())
      .then(sezony => {
        if (cancelled || !Array.isArray(sezony)) return;
        const aktywny = sezony.find(s => s.aktywny);
        if (aktywny) {
          setAktywnySezon(aktywny);
          fetch(`/api/admin/kadra?sezonId=${aktywny.id}`)
            .then(r => r.json())
            .then(ids => { if (!cancelled && Array.isArray(ids)) setKadraPlayerIds(new Set(ids)); })
            .catch(() => {});
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [tick]);

  // odświeżaj listę co 30s żeby status online był aktualny bez reload
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const isAdmin = data.currentRole === "ADMIN";

  function openCreate() {
    setEditId(null);
    setForm(emptyUserForm);
    setError("");
    setFormOpen(true);
    setStatsUserId(null);
    setResetPwId(null);
    setHealthUserId(null);
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
      dataUrodzenia: "",
      uprawnienia: u.uprawnienia || [],
    });
    setError("");
    setFormOpen(true);
    setStatsUserId(null);
    setResetPwId(null);
    setHealthUserId(null);
  }

  async function openStats(u) {
    if (statsUserId === u.id) { setStatsUserId(null); return; }
    setStatsUserId(u.id);
    setHealthUserId(null);
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

  async function openHealth(u) {
    if (healthUserId === u.id) { setHealthUserId(null); return; }
    setHealthUserId(u.id);
    setStatsUserId(null);
    setResetPwId(null);
    setHealthCopied(false);
    setHealthLoading(true);
    setHealthToken(null);
    setHealthToday(null);
    setHealthExercises([]);
    try {
      const r = await fetch(`/api/admin/gracze/${u.id}/health-token`);
      const d = await r.json();
      setHealthToken(d.healthToken ?? null);
      setHealthToday(d.today ?? null);
      setHealthExercises(d.exercises ?? []);
    } catch { /* noop */ }
    finally { setHealthLoading(false); }
  }

  async function generateHealthToken(userId) {
    setHealthGenerating(true);
    setHealthCopied(false);
    try {
      const r = await fetch(`/api/admin/gracze/${userId}/health-token`, { method: "POST" });
      const d = await r.json();
      if (r.ok) setHealthToken(d.healthToken);
    } catch { /* noop */ }
    finally { setHealthGenerating(false); }
  }

  function copyHealthUrl() {
    const url = `https://mksdrawadrawno.pl/api/health-webhook/${healthToken}`;
    navigator.clipboard?.writeText(url);
    setHealthCopied(true);
    setTimeout(() => setHealthCopied(false), 2000);
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
    setSaving(true); setError("");
    try {
      const url = editId ? `/api/admin/gracze/${editId}` : "/api/admin/gracze";
      const method = editId ? "PATCH" : "POST";
      const body = { ...form };
      if (editId && !body.password) delete body.password;
      if (body.password && editId) body.newPassword = body.password;

      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Błąd"); setSaving(false); return; }

      setSuccess(editId ? "Zapisano zmiany" : "Konto utworzone");
      setTimeout(() => setSuccess(""), 3000);
      setFormOpen(false);
      load();
    } catch { setError("Błąd połączenia"); }
    finally { setSaving(false); }
  }

  async function toggleActive(u) {
    await fetch(`/api/admin/gracze/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    load();
  }

  async function toggleKadra(playerId) {
    if (!aktywnySezon || kadraToggling) return;
    setKadraToggling(playerId);
    const inKadra = kadraPlayerIds.has(playerId);
    await fetch("/api/admin/kadra", {
      method: inKadra ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, sezonId: aktywnySezon.id }),
    });
    setKadraPlayerIds(prev => {
      const next = new Set(prev);
      if (inKadra) next.delete(playerId); else next.add(playerId);
      return next;
    });
    setKadraToggling(null);
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
      setSuccess("Hasło zmienione");
      setTimeout(() => setSuccess(""), 3000);
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
            Drużyna
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{data.users.length} zawodników</div>
        </div>
        {isAdmin && (
          <button onClick={openCreate} style={btnPrimary}>+ Dodaj gracza</button>
        )}
      </div>

      {success && <div style={alertSuccess}>{success}</div>}

      {/* Admin create/edit form */}
      {isAdmin && formOpen && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "22px 22px", marginBottom: 24 }}>
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
                <input style={inp} value={form.login} onChange={f("login")} required placeholder="jkowalski" />
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input style={inp} type="email" value={form.email} onChange={f("email")} placeholder="jan@email.pl" />
              </div>
              <div>
                <label style={lbl}>{editId ? "Nowe hasło (zostaw puste)" : "Hasło *"}</label>
                <input style={inp} type="password" value={form.password} onChange={f("password")} required={!editId} placeholder="••••••" />
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
                  {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
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
            {form.role !== "ADMIN" && (
              <div style={{ marginTop: 16 }}>
                <label style={{ ...lbl, marginBottom: 10 }}>UPRAWNIENIA DO PODSTRON</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 6 }}>
                  {UPRAWNIENIA_OPTIONS.map(({ slug, label }) => (
                    <label key={slug} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#94a3b8", padding: "4px 0" }}>
                      <input
                        type="checkbox"
                        checked={form.uprawnienia.includes(slug)}
                        onChange={(e) => {
                          setForm((p) => ({
                            ...p,
                            uprawnienia: e.target.checked
                              ? [...p.uprawnienia, slug]
                              : p.uprawnienia.filter((s) => s !== slug),
                          }));
                        }}
                        style={{ width: 16, height: 16, accentColor: "#3b82f6" }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            )}
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
      ) : data.users.length === 0 ? (
        <div style={{ color: "#475569", fontSize: 14, padding: 20, textAlign: "center" }}>Brak zawodników.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[...data.users].sort((a, b) => {
            const ao = isOnline(a.lastSeen), bo = isOnline(b.lastSeen);
            if (ao !== bo) return ao ? -1 : 1;
            if (!a.lastSeen && !b.lastSeen) return 0;
            if (!a.lastSeen) return 1;
            if (!b.lastSeen) return -1;
            return new Date(b.lastSeen) - new Date(a.lastSeen);
          }).map((u) => {
            const online = isOnline(u.lastSeen);
            const ago = timeAgo(u.lastSeen);
            const name = u.player?.imieNazwisko || u.login;
            const roleInfo = ROLES.find((r) => r.value === u.role);

            return (
              <div key={u.id}>
                {/* Player row */}
                <div className="player-row" style={{
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 10,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* Avatar + status dot */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <Avatar foto={u.player?.foto} name={name} size={40} />
                      <span style={{
                        position: "absolute", bottom: 1, right: 1,
                        width: 10, height: 10, borderRadius: "50%",
                        background: online ? "#22c55e" : "#374151",
                        border: "2px solid #030712",
                      }} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{name}</span>
                        {u.player?.numer && (
                          <span style={{ color: "#475569", fontSize: 11, fontFamily: "monospace" }}>#{u.player.numer}</span>
                        )}
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 20,
                          background: u.role === "ADMIN" ? "rgba(239,68,68,0.1)" : u.role === "STAFF" ? "rgba(251,191,36,0.1)" : "rgba(59,130,246,0.1)",
                          color: u.role === "ADMIN" ? "#ef4444" : u.role === "STAFF" ? "#fbbf24" : "#3b82f6",
                          border: `1px solid ${u.role === "ADMIN" ? "rgba(239,68,68,0.2)" : u.role === "STAFF" ? "rgba(251,191,36,0.2)" : "rgba(59,130,246,0.2)"}`,
                        }}>
                          {roleInfo?.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 2, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {u.player?.pozycja && <span>{u.player.pozycja}</span>}
                        <span style={{ color: online ? "#22c55e" : "#374151" }}>
                          {online ? "● Online" : ago ? `● ${ago}` : "● Nigdy"}
                        </span>
                      </div>
                    </div>

                    {/* DM + admin actions — desktop only inline */}
                    <div className="player-actions-desktop" style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                      {u.id !== data.currentUserId && (
                        <Link href={`/panel/dm/${u.id}`} style={{ padding: "4px 10px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 6, color: "#3b82f6", fontSize: 11, fontWeight: 600, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          Napisz
                        </Link>
                      )}
                      {isAdmin && (
                        <>
                          <button onClick={() => openEdit(u)} style={btnRowAction}>Edytuj</button>
                          <button
                            onClick={() => { setResetPwId(resetPwId === u.id ? null : u.id); setResetPw(""); setError(""); setStatsUserId(null); }}
                            style={btnRowAction}
                          >Hasło</button>
                          {u.player && (
                            <button
                              onClick={() => { setResetPwId(null); openStats(u); }}
                              style={{ ...btnRowAction, color: statsUserId === u.id ? "#3b82f6" : "#64748b", borderColor: statsUserId === u.id ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.08)" }}
                            >Staty</button>
                          )}
                          {u.player && (
                            <button
                              onClick={() => { setResetPwId(null); openHealth(u); }}
                              style={{ ...btnRowAction, color: healthUserId === u.id ? "#3b82f6" : "#64748b", borderColor: healthUserId === u.id ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.08)" }}
                            >Band</button>
                          )}
                          {u.player && aktywnySezon && (
                            <button
                              onClick={() => toggleKadra(u.player.id)}
                              disabled={kadraToggling === u.player.id}
                              style={{ ...btnRowAction, color: kadraPlayerIds.has(u.player.id) ? "#22c55e" : "#64748b", borderColor: kadraPlayerIds.has(u.player.id) ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.08)" }}
                              title={kadraPlayerIds.has(u.player.id) ? `W kadrze ${aktywnySezon.nazwa}` : `Dodaj do kadry ${aktywnySezon.nazwa}`}
                            >{kadraPlayerIds.has(u.player.id) ? "★ Kadra" : "Kadra"}</button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* DM + admin actions — mobile row below */}
                  <div className="player-actions-mobile" style={{ display: "none", gap: 6, marginTop: 8, paddingLeft: 52, flexWrap: "wrap" }}>
                    {u.id !== data.currentUserId && (
                      <Link href={`/panel/dm/${u.id}`} style={{ padding: "5px 12px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 6, color: "#3b82f6", fontSize: 11, fontWeight: 600, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        Napisz
                      </Link>
                    )}
                    {isAdmin && (
                      <>
                        <button onClick={() => openEdit(u)} style={btnRowAction}>Edytuj</button>
                        <button
                          onClick={() => { setResetPwId(resetPwId === u.id ? null : u.id); setResetPw(""); setError(""); setStatsUserId(null); }}
                          style={btnRowAction}
                        >Hasło</button>
                        {u.player && (
                          <button
                            onClick={() => { setResetPwId(null); openStats(u); }}
                            style={{ ...btnRowAction, color: statsUserId === u.id ? "#3b82f6" : "#64748b", borderColor: statsUserId === u.id ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.08)" }}
                          >Staty</button>
                        )}
                        {u.player && (
                          <button
                            onClick={() => { setResetPwId(null); openHealth(u); }}
                            style={{ ...btnRowAction, color: healthUserId === u.id ? "#3b82f6" : "#64748b", borderColor: healthUserId === u.id ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.08)" }}
                          >Band</button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Reset password row */}
                {isAdmin && resetPwId === u.id && (
                  <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderTop: "none", borderRadius: "0 0 8px 8px", marginTop: -4 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "#64748b" }}>Nowe hasło dla {u.login}:</span>
                      <input type="password" value={resetPw} onChange={(e) => setResetPw(e.target.value)}
                        placeholder="min. 6 znaków" style={{ ...inp, width: 180, padding: "6px 10px", fontSize: 12 }} />
                      <button onClick={() => handleResetPw(u.id)} disabled={saving} style={{ ...btnPrimary, padding: "6px 14px", fontSize: 12 }}>Zmień</button>
                      <button onClick={() => setResetPwId(null)} style={{ ...btnGhost, padding: "6px 12px", fontSize: 12 }}>Anuluj</button>
                      {error && <span style={{ fontSize: 12, color: "#ef4444" }}>{error}</span>}
                    </div>
                  </div>
                )}

                {/* Stats row */}
                {isAdmin && statsUserId === u.id && (
                  <div style={{ padding: "14px 16px", background: "rgba(59,130,246,0.03)", border: "1px solid rgba(59,130,246,0.1)", borderTop: "none", borderRadius: "0 0 8px 8px", marginTop: -4 }}>
                    {statsLoading ? (
                      <span style={{ fontSize: 12, color: "#475569" }}>Ładowanie...</span>
                    ) : statsSezony.length === 0 ? (
                      <span style={{ fontSize: 12, color: "#475569" }}>Brak sezonów — utwórz sezon w zakładce Sezony.</span>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em" }}>SEZON</span>
                          <select value={statsSezonId} onChange={(e) => onSezonChange(e.target.value)}
                            style={{ ...inp, width: "auto", minWidth: 120, padding: "5px 10px", fontSize: 12 }}>
                            {statsSezony.map((s) => <option key={s.id} value={s.id}>{s.nazwa}{s.aktywny ? " ★" : ""}</option>)}
                          </select>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 8 }}>
                          {STAT_FIELDS.map(({ key, label }) => (
                            <div key={key}>
                              <label style={{ ...lbl, fontSize: 10 }}>{label.toUpperCase()}</label>
                              <input type="number" min="0" value={statsForm[key] ?? 0}
                                onChange={(e) => setStatsForm((f) => ({ ...f, [key]: e.target.value }))}
                                style={{ ...inp, padding: "6px 10px", fontSize: 14, fontWeight: 700 }} />
                            </div>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <button onClick={saveStats} disabled={statsSaving || !statsSezonId} style={{ ...btnPrimary, padding: "6px 16px", fontSize: 12 }}>
                            {statsSaving ? "Zapisuję..." : "Zapisz staty"}
                          </button>
                          <button onClick={() => setStatsUserId(null)} style={{ ...btnGhost, padding: "6px 12px", fontSize: 12 }}>Zamknij</button>
                          {statsSuccess && <span style={{ fontSize: 12, color: "#22c55e" }}>{statsSuccess}</span>}
                          {statsError && <span style={{ fontSize: 12, color: "#ef4444" }}>{statsError}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Health/band token row */}
                {isAdmin && healthUserId === u.id && (
                  <div style={{ padding: "14px 16px", background: "rgba(59,130,246,0.03)", border: "1px solid rgba(59,130,246,0.1)", borderTop: "none", borderRadius: "0 0 8px 8px", marginTop: -4 }}>
                    {healthLoading ? (
                      <span style={{ fontSize: 12, color: "#475569" }}>Ładowanie...</span>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {healthToken ? (
                          <div>
                            <label style={{ ...lbl, fontSize: 10 }}>URL DO WPISANIA W APCE HEALTH CONNECT WEBHOOK</label>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                              <code style={{ fontSize: 11, color: "#94a3b8", background: "rgba(0,0,0,0.3)", padding: "6px 10px", borderRadius: 6, wordBreak: "break-all" }}>
                                https://mksdrawadrawno.pl/api/health-webhook/{healthToken}
                              </code>
                              <button onClick={copyHealthUrl} style={{ ...btnGhost, padding: "6px 12px", fontSize: 12 }}>
                                {healthCopied ? "Skopiowano ✓" : "Kopiuj"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "#64748b" }}>Ten gracz nie ma jeszcze tokenu do bandu.</span>
                        )}

                        {healthToday && (
                          <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#94a3b8" }}>
                            <span>Dziś: <strong style={{ color: "#fff" }}>{healthToday.steps}</strong> kroków</span>
                            {healthToday.heartRateAvg != null && (
                              <span>śr. tętno: <strong style={{ color: "#fff" }}>{Math.round(healthToday.heartRateAvg)}</strong> bpm</span>
                            )}
                            <span>kalorie: <strong style={{ color: "#fff" }}>{Math.round(healthToday.activeCalories)}</strong></span>
                          </div>
                        )}

                        {healthExercises.length > 0 && (
                          <div>
                            <label style={{ ...lbl, fontSize: 10 }}>OSTATNIE TRENINGI</label>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {healthExercises.map((ex) => (
                                <div
                                  key={ex.id}
                                  style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 12, color: "#94a3b8", background: "rgba(0,0,0,0.2)", padding: "6px 10px", borderRadius: 6, flexWrap: "wrap" }}
                                >
                                  <span style={{ color: "#fff", fontWeight: 600 }}>{exerciseLabel(ex.exerciseType)}</span>
                                  <span>{formatExerciseWhen(ex.startTime)}</span>
                                  <span>{formatDuration(ex.durationSeconds)}</span>
                                  {ex.heartRateAvg != null && (
                                    <span>śr. tętno: <strong style={{ color: "#fff" }}>{Math.round(ex.heartRateAvg)}</strong> bpm</span>
                                  )}
                                  {ex.heartRateMax != null && (
                                    <span>maks: <strong style={{ color: "#fff" }}>{Math.round(ex.heartRateMax)}</strong> bpm</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <button
                            onClick={() => generateHealthToken(u.id)}
                            disabled={healthGenerating}
                            style={{ ...btnPrimary, padding: "6px 16px", fontSize: 12 }}
                          >
                            {healthGenerating ? "Generuję..." : healthToken ? "Wygeneruj nowy token" : "Wygeneruj token"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        select option { background: #0f172a; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.4); }
        input::placeholder { color: #334155; }
        input:focus, select:focus { outline: none; border-color: rgba(59,130,246,0.5) !important; }
        @media (max-width: 640px) {
          .player-actions-desktop { display: none !important; }
          .player-actions-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

const lbl = { display: "block", fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 6 };
const inp = { width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#fff", fontSize: 13, transition: "border-color 0.2s", boxSizing: "border-box" };
const btnPrimary = { padding: "9px 18px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnGhost = { padding: "9px 14px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#64748b", fontSize: 13, cursor: "pointer" };
const btnRowAction = { padding: "4px 10px", background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#64748b", fontSize: 11, cursor: "pointer" };
const alertSuccess = { fontSize: 13, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 7, padding: "9px 13px", marginBottom: 16 };
const alertErr = { fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "9px 13px" };
