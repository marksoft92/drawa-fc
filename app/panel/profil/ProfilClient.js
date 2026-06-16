"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const ROLE_LABEL = { ADMIN: "Administrator", PLAYER: "Piłkarz", STAFF: "Sztab" };

function urlBase64ToUint8Array(b) {
  const pad = "=".repeat((4 - (b.length % 4)) % 4);
  const base64 = (b + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function Toggle({ on, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      style={{
        width: 40, height: 22, borderRadius: 11, border: "none", cursor: disabled ? "not-allowed" : "pointer",
        background: on ? "#2563eb" : "rgba(255,255,255,0.1)", position: "relative", flexShrink: 0,
        transition: "background 0.2s", opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: on ? 21 : 3,
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s", display: "block",
      }} />
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.08em", marginBottom: 14 }}>{title.toUpperCase()}</div>
      {children}
    </div>
  );
}

function Row({ label, desc, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 500 }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{desc}</div>}
      </div>
      {right}
    </div>
  );
}

export default function ProfilClient({ login, email: initEmail, role, player, showOnline: initShowOnline, notifChat: initNotifChat, notifDm: initNotifDm, notifAnkiety: initNotifAnkiety }) {
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);

  const [email, setEmail] = useState(initEmail ?? "");
  const [emailPw, setEmailPw] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const [fotoUrl, setFotoUrl] = useState(player?.foto ?? null);
  const [fotoUploading, setFotoUploading] = useState(false);
  const [fotoError, setFotoError] = useState("");

  // ustawienia
  const [showOnline, setShowOnline] = useState(initShowOnline);
  const [notifChat, setNotifChat] = useState(initNotifChat);
  const [notifDm, setNotifDm] = useState(initNotifDm);
  const [notifAnkiety, setNotifAnkiety] = useState(initNotifAnkiety);
  const [savingFlag, setSavingFlag] = useState(null);

  // push
  const [pushStatus, setPushStatus] = useState("loading"); // loading|unsupported|denied|off|on|working
  const [pushSub, setPushSub] = useState(null);

  const router = useRouter();
  const displayName = player?.imieNazwisko || login;
  const initials = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) { setPushStatus("unsupported"); return; }
    if (Notification.permission === "denied") { setPushStatus("denied"); return; }
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((s) => { setPushSub(s); setPushStatus(s ? "on" : "off"); });
    });
  }, []);

  async function togglePush() {
    setPushStatus("working");
    try {
      const reg = await navigator.serviceWorker.ready;
      if (pushSub) {
        await pushSub.unsubscribe();
        await fetch("/api/panel/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: pushSub.endpoint }) });
        setPushSub(null); setPushStatus("off");
      } else {
        const { publicKey } = await fetch("/api/panel/push").then((r) => r.json());
        const perm = await Notification.requestPermission();
        if (perm !== "granted") { setPushStatus("denied"); return; }
        const newSub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
        await fetch("/api/panel/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newSub.toJSON()) });
        setPushSub(newSub); setPushStatus("on");
      }
    } catch { setPushStatus(pushSub ? "on" : "off"); }
  }

  const patchFlag = useCallback(async (key, value, setter) => {
    setSavingFlag(key);
    setter(value);
    try {
      await fetch("/api/panel/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [key]: value }) });
    } catch { setter(!value); }
    setSavingFlag(null);
  }, []);

  async function handleFotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoError(""); setFotoUploading(true);
    try {
      const fd = new FormData(); fd.append("foto", file);
      const r = await fetch("/api/panel/foto", { method: "POST", body: fd });
      const d = await r.json();
      if (r.ok) { setFotoUrl(d.foto + "?t=" + Date.now()); router.refresh(); }
      else setFotoError(d.error || "Błąd uploadu");
    } catch { setFotoError("Błąd połączenia"); }
    finally { setFotoUploading(false); }
  }

  async function handlePwChange(e) {
    e.preventDefault(); setPwError(""); setPwSuccess("");
    if (newPw !== confirm) { setPwError("Hasła nie są identyczne"); return; }
    if (newPw.length < 6) { setPwError("Min. 6 znaków"); return; }
    setSavingPw(true);
    try {
      const r = await fetch("/api/auth/haslo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: current, newPassword: newPw }) });
      const d = await r.json();
      if (r.ok) { setCurrent(""); setNewPw(""); setConfirm(""); setShowPwForm(false); setPwSuccess("Hasło zmienione"); router.refresh(); }
      else setPwError(d.error || "Błąd");
    } catch { setPwError("Błąd połączenia"); }
    finally { setSavingPw(false); }
  }

  async function handleEmailChange(e) {
    e.preventDefault(); setEmailError(""); setEmailSuccess("");
    setSavingEmail(true);
    try {
      const r = await fetch("/api/panel/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), currentPassword: emailPw }) });
      const d = await r.json();
      if (r.ok) { setEmailPw(""); setShowEmailForm(false); setEmailSuccess("Email zaktualizowany"); router.refresh(); }
      else setEmailError(d.error || "Błąd");
    } catch { setEmailError("Błąd połączenia"); }
    finally { setSavingEmail(false); }
  }

  const pushOn = pushStatus === "on";
  const pushDenied = pushStatus === "denied";
  const pushUnsupported = pushStatus === "unsupported";

  return (
    <div style={{ maxWidth: 480, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: "clamp(20px,4vw,28px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff" }}>Profil</div>
        <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>Twoje konto i ustawienia</div>
      </div>

      {/* Karta użytkownika */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: player ? 16 : 0 }}>
          <label style={{ position: "relative", cursor: "pointer", flexShrink: 0 }} title="Zmień zdjęcie">
            <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleFotoUpload} disabled={fotoUploading} />
            {fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fotoUrl} alt="Zdjęcie" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: "2px solid rgba(59,130,246,0.35)" }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#3b82f6" }}>{initials}</div>
            )}
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 18, height: 18, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
              {fotoUploading ? "…" : "✎"}
            </div>
          </label>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{displayName}</div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>@{login} · {ROLE_LABEL[role] ?? role}</div>
            {initEmail && <div style={{ fontSize: 11, color: "#334155", marginTop: 1 }}>{initEmail}</div>}
          </div>
        </div>
        {fotoError && <div style={alertErr}>{fotoError}</div>}
        {player && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[{ label: "Pozycja", value: player.pozycja }, { label: "Numer", value: player.numer }]
              .filter((r) => r.value != null)
              .map((row) => (
                <div key={row.label} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: "#475569", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 3 }}>{row.label.toUpperCase()}</div>
                  <div style={{ fontSize: 14, color: "#fff" }}>{row.value}</div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Zmiana hasła */}
      <div style={card}>
        <button onClick={() => { setShowPwForm((v) => !v); setPwError(""); setPwSuccess(""); }} style={collapseBtn}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>Zmień hasło</span>
          <span style={{ fontSize: 18, color: "#475569" }}>{showPwForm ? "−" : "+"}</span>
        </button>
        {showPwForm && (
          <form onSubmit={handlePwChange} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
            <div><label style={lbl}>Aktualne hasło</label><input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} style={inp} required autoComplete="current-password" placeholder="••••••" autoFocus /></div>
            <div><label style={lbl}>Nowe hasło</label><input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} style={inp} required autoComplete="new-password" placeholder="min. 6 znaków" /></div>
            <div><label style={lbl}>Powtórz nowe hasło</label><input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={inp} required autoComplete="new-password" placeholder="••••••" /></div>
            {pwError && <div style={alertErr}>{pwError}</div>}
            <button type="submit" disabled={savingPw} style={btnPrimary}>{savingPw ? "Zapisuję..." : "Zmień hasło"}</button>
          </form>
        )}
        {pwSuccess && <div style={{ ...alertOk, marginTop: 12 }}>{pwSuccess}</div>}
      </div>

      {/* Zmiana emaila */}
      <div style={card}>
        <button onClick={() => { setShowEmailForm((v) => !v); setEmailError(""); setEmailSuccess(""); }} style={collapseBtn}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>Zmień email</span>
          <span style={{ fontSize: 18, color: "#475569" }}>{showEmailForm ? "−" : "+"}</span>
        </button>
        {showEmailForm && (
          <form onSubmit={handleEmailChange} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
            <div><label style={lbl}>Nowy adres email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inp} autoComplete="email" placeholder="nowy@email.pl" autoFocus /></div>
            <div><label style={lbl}>Potwierdź aktualnym hasłem</label><input type="password" value={emailPw} onChange={(e) => setEmailPw(e.target.value)} style={inp} required autoComplete="current-password" placeholder="••••••" /></div>
            {emailError && <div style={alertErr}>{emailError}</div>}
            <button type="submit" disabled={savingEmail} style={btnPrimary}>{savingEmail ? "Zapisuję..." : "Zapisz email"}</button>
          </form>
        )}
        {emailSuccess && <div style={{ ...alertOk, marginTop: 12 }}>{emailSuccess}</div>}
      </div>

      {/* Prywatność */}
      <Section title="Prywatność">
        <Row
          label="Status online widoczny"
          desc="Inni gracze widzą kiedy jesteś aktywny"
          right={<Toggle on={showOnline} onChange={(v) => patchFlag("showOnline", v, setShowOnline)} disabled={savingFlag === "showOnline"} />}
        />
      </Section>

      {/* Powiadomienia push */}
      <Section title="Powiadomienia">
        {!pushUnsupported && (
          <Row
            label="Push na tym urządzeniu"
            desc={pushDenied ? "Blokada w ustawieniach przeglądarki" : pushOn ? "Włączone" : "Wyłączone"}
            right={
              pushDenied ? (
                <span style={{ fontSize: 11, color: "#ef4444" }}>Zablokowane</span>
              ) : (
                <Toggle on={pushOn} onChange={togglePush} disabled={pushStatus === "loading" || pushStatus === "working"} />
              )
            }
          />
        )}
        <Row
          label="Chat grupowy"
          desc="Powiadomienie o nowej wiadomości w chacie"
          right={<Toggle on={notifChat} onChange={(v) => patchFlag("notifChat", v, setNotifChat)} disabled={savingFlag === "notifChat"} />}
        />
        <Row
          label="Wiadomości prywatne"
          desc="Powiadomienie o nowym DM"
          right={<Toggle on={notifDm} onChange={(v) => patchFlag("notifDm", v, setNotifDm)} disabled={savingFlag === "notifDm"} />}
        />
        <Row
          label="Ankiety"
          desc="Powiadomienie o nowej ankiecie"
          right={<Toggle on={notifAnkiety} onChange={(v) => patchFlag("notifAnkiety", v, setNotifAnkiety)} disabled={savingFlag === "notifAnkiety"} />}
        />
      </Section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #334155; }
        input:focus { outline: none; border-color: rgba(59,130,246,0.5) !important; background: rgba(15,23,42,0.8) !important; }
      `}</style>
    </div>
  );
}

const card = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 20px" };
const lbl = { display: "block", fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 7 };
const inp = { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 14, transition: "border-color 0.2s" };
const btnPrimary = { padding: "10px 20px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" };
const alertErr = { fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "9px 13px" };
const alertOk = { fontSize: 13, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 7, padding: "9px 13px" };
const collapseBtn = { width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", padding: 0 };
