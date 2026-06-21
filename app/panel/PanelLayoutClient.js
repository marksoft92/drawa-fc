"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const CHAT_NAV_ITEM = {
  label: "Chat",
  href: "/panel/chat",
  icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
};

const PUSH_NAV_ITEM = {
  label: "Powiadomienie",
  href: "/panel/powiadomienie",
  icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
};

const DM_NAV_ITEM = {
  label: "Wiadomości",
  href: "/panel/dm",
  badgeKey: "dm",
  icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5l-3 3v-3z" />
    </svg>
  ),
};

const ANKIETY_NAV_ITEM = {
  label: "Ankiety",
  href: "/panel/ankiety",
  icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 9h6M9 12h6M9 15h4" />
    </svg>
  ),
};

const ADMIN_NAV = [
  {
    label: "Analityka",
    href: "/panel/analityka",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 6-6" />
      </svg>
    ),
  },
  {
    label: "Gracze",
    href: "/panel/gracze",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
      </svg>
    ),
  },
  {
    label: "Aktualności",
    href: "/panel/aktualnosci",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
        <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z" />
      </svg>
    ),
  },
  {
    label: "Sezony",
    href: "/panel/sezony",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    label: "Galeria",
    href: "/panel/galeria",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/>
      </svg>
    ),
  },
  {
    label: "Kontakt",
    href: "/panel/kontakt",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
  },
  {
    label: "Struktura",
    href: "/panel/struktura",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    label: "Sponsorzy",
    href: "/panel/sponsorzy",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    label: "Strony",
    href: "/panel/strony",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: "Wideo",
    href: "/panel/wideo",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
      </svg>
    ),
  },
  {
    label: "Komentarze",
    href: "/panel/komentarze",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
    ),
  },
  {
    label: "Typowanie",
    href: "/panel/typowanie",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="2" />
        <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="16" cy="8" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="8" cy="16" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Liga",
    href: "/panel/liga",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
      </svg>
    ),
  },
  {
    label: "Scraper",
    href: "/panel/scraper",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><path d="M20 12v6"/><path d="M17 15h6"/>
      </svg>
    ),
  },
  {
    label: "Transmisja",
    href: "/panel/transmisja",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Koszty",
    href: "/panel/koszty",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: "Newsletter",
    href: "/panel/newsletter",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
  },
  {
    label: "Serwer",
    href: "/panel/serwer",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><circle cx="6" cy="6" r="1" fill="currentColor" /><circle cx="6" cy="18" r="1" fill="currentColor" />
      </svg>
    ),
  },
  DM_NAV_ITEM,
  CHAT_NAV_ITEM,
  ANKIETY_NAV_ITEM,
  PUSH_NAV_ITEM,
  {
    label: "Profil",
    href: "/panel/profil",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20v-1a8 8 0 0 1 16 0v1" />
      </svg>
    ),
  },
];

const DRUZYNA_NAV_ITEM = {
  label: "Drużyna",
  href: "/panel/gracze",
  icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  ),
};

const PLAYER_NAV = [
  {
    label: "Profil",
    href: "/panel/profil",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20v-1a8 8 0 0 1 16 0v1" />
      </svg>
    ),
  },
  {
    label: "Statystyki",
    href: "/panel/statystyki",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
  DRUZYNA_NAV_ITEM,
  DM_NAV_ITEM,
  CHAT_NAV_ITEM,
  ANKIETY_NAV_ITEM,
];

const STAFF_NAV = [
  DRUZYNA_NAV_ITEM,
  DM_NAV_ITEM,
  CHAT_NAV_ITEM,
  ANKIETY_NAV_ITEM,
  PUSH_NAV_ITEM,
  {
    label: "Profil",
    href: "/panel/profil",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20v-1a8 8 0 0 1 16 0v1" />
      </svg>
    ),
  },
];

function urlBase64ToUint8Array(b) {
  const pad = "=".repeat((4 - (b.length % 4)) % 4);
  const base64 = (b + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function PanelLayoutClient({ role, uprawnienia = [], login, name, foto, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [badges, setBadges] = useState({ chat: 0, ankiety: 0 });
  const [pushBanner, setPushBanner] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const baseNav = role === "ADMIN" ? ADMIN_NAV : role === "STAFF" ? STAFF_NAV : PLAYER_NAV;
  const extraNav = role !== "ADMIN" && uprawnienia.length > 0
    ? ADMIN_NAV.filter(item => uprawnienia.includes(item.href.replace("/panel/", "")))
        .filter(item => !baseNav.some(b => b.href === item.href))
    : [];
  const navItems = extraNav.length > 0
    ? [...extraNav, ...baseNav]
    : baseNav;
  const displayName = name || login;
  const initials = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    const ping = () => fetch("/api/panel/heartbeat", { method: "POST" }).catch(() => {});
    ping();
    const interval = setInterval(ping, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // auto push subscription
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const perm = Notification.permission;
    if (perm === "denied") return;

    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      if (existing) return; // już subskrybowany

      if (perm === "granted") {
        // cicha auto-subskrypcja
        try {
          const { publicKey } = await fetch("/api/panel/push").then((r) => r.json());
          const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
          await fetch("/api/panel/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
        } catch {}
      } else {
        // "default" — pokaż banner po 3s
        setTimeout(() => setPushBanner(true), 3000);
      }
    });
  }, []);

  async function enablePush() {
    setPushBanner(false);
    try {
      const reg = await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return;
      const { publicKey } = await fetch("/api/panel/push").then((r) => r.json());
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      await fetch("/api/panel/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
    } catch {}
  }

  useEffect(() => {
    // zero out immediately before fetch so badge doesn't flash
    setBadges((b) => ({
      ...b,
      ...(pathname.startsWith("/panel/chat") ? { chat: 0 } : {}),
      ...(pathname.startsWith("/panel/ankiety") ? { ankiety: 0 } : {}),
      ...(pathname.startsWith("/panel/dm") ? { dm: 0 } : {}),
    }));

    let cancelled = false;
    fetch("/api/panel/badges")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d || cancelled) return;
        // never show badge for page the user is actively viewing
        if (pathname.startsWith("/panel/chat")) d.chat = 0;
        if (pathname.startsWith("/panel/ankiety")) d.ankiety = 0;
        if (pathname.startsWith("/panel/dm")) d.dm = 0;
        setBadges(d);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function getBadge(href) {
    if (href === "/panel/chat") return badges.chat;
    if (href === "/panel/ankiety") return badges.ankiety;
    if (href === "/panel/dm") return badges.dm ?? 0;
    return 0;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#030712", display: "flex" }}>
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        />
      )}

      <aside className={`panel-sidebar${sidebarOpen ? " panel-sidebar-open" : ""}`} style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 240,
        background: "#0a0f1a", borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column", zIndex: 50, transition: "transform 0.25s",
        overflowY: "auto",
      }}>
        <Link href="/" style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="MKS Drawa" width={36} height={36} style={{ objectFit: "contain", borderRadius: 4, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff", lineHeight: 1 }}>
              MKS Drawa
            </div>
            <div style={{ fontSize: 9, color: role === "ADMIN" ? "#3b82f6" : "#22c55e", letterSpacing: "0.2em" }}>
              {role === "ADMIN" ? "ADMIN" : role === "STAFF" ? "SZTAB" : "PIŁKARZ"}
            </div>
          </div>
        </Link>

        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const badge = getBadge(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 500,
                  color: active ? "#fff" : "#64748b",
                  background: active ? "rgba(59,130,246,0.12)" : "transparent",
                  border: active ? "1px solid rgba(59,130,246,0.2)" : "1px solid transparent",
                  transition: "all 0.15s",
                  minHeight: 44, position: "relative",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#94a3b8"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "#64748b"; }}
              >
                <span style={{ color: active ? "#3b82f6" : "inherit", opacity: active ? 1 : 0.6, flexShrink: 0, position: "relative" }}>
                  {item.icon}
                  {badge > 0 && !active && (
                    <span style={{ position: "absolute", top: -5, right: -5, minWidth: 14, height: 14, borderRadius: 7, background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px", lineHeight: 1 }}>
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {badge > 0 && !active && (
                  <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px", marginLeft: "auto" }}>
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            {foto ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={foto} alt={initials} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", objectPosition: "top", flexShrink: 0, border: "1.5px solid rgba(255,255,255,0.12)" }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#3b82f6", flexShrink: 0 }}>
                {initials}
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
              <div style={{ fontSize: 10, color: "#334155" }}>{role === "ADMIN" ? "Admin" : role === "STAFF" ? "Sztab" : "Piłkarz"}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/" style={{ fontSize: 12, color: "#475569", textDecoration: "none", flex: 1, display: "flex", alignItems: "center" }}>← Strona</Link>
            <button onClick={handleLogout} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#64748b", fontSize: 12, padding: "6px 12px", cursor: "pointer" }}>
              Wyloguj
            </button>
          </div>
        </div>
      </aside>

      <div className="panel-main" style={{ flex: 1, marginLeft: 240, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div className="panel-topbar" style={{
          height: 52, borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 16px", display: "flex", alignItems: "center", gap: 12,
          background: "#030712", position: "sticky", top: 0, zIndex: 30,
        }}>
          <button
            className="panel-hamburger"
            onClick={() => setSidebarOpen((o) => !o)}
            style={{ display: "none", background: "none", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#94a3b8", fontSize: 18, padding: "6px 10px", cursor: "pointer", lineHeight: 1, flexShrink: 0, minWidth: 40, minHeight: 40 }}
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>
          <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>
            {navItems.find((i) => pathname.startsWith(i.href))?.label ?? (role === "ADMIN" ? "Dashboard" : "Panel")}
          </div>
        </div>
        <div className="panel-content" style={{ flex: 1, padding: "24px 24px" }}>{children}</div>
      </div>

      {pushBanner && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 300, background: "#0f172a", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.6)", maxWidth: "calc(100vw - 32px)", width: 380 }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>🔔</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Włącz powiadomienia</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>Treningi, mecze, wiadomości — na bieżąco</div>
          </div>
          <button onClick={enablePush} style={{ padding: "7px 14px", background: "#2563eb", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Włącz</button>
          <button onClick={() => setPushBanner(false)} style={{ background: "none", border: "none", color: "#475569", fontSize: 18, cursor: "pointer", padding: "0 2px", flexShrink: 0, lineHeight: 1 }}>✕</button>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #030712; color: #fff; font-family: -apple-system,'Segoe UI',sans-serif; overflow-x: hidden; }
        input::placeholder { color: #334155; }
        input:focus { outline: none; border-color: rgba(59,130,246,0.5) !important; }
        @media (max-width: 768px) {
          .panel-sidebar { transform: translateX(-100%); }
          .panel-sidebar-open { transform: translateX(0) !important; }
          .panel-main { margin-left: 0 !important; }
          .panel-hamburger { display: flex !important; align-items: center; justify-content: center; }
          .panel-content { padding: 16px 14px !important; }
        }
      `}</style>
    </div>
  );
}
