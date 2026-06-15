"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const isDrawa = (name) => name?.toLowerCase().includes("drawa");

const NAV_LINKS = [
 { label: "Aktualności", id: "aktualnosci" },
 { label: "Mecze", id: "mecze" },
 { label: "Tabela", id: "tabela" },
 { label: "Statystyki", id: "statystyki" },
 { label: "Galeria", id: "galeria" },
 { label: "Kadra", id: "kadra" },
 { label: "Struktura", id: "struktura" },
 { label: "Dojazd", id: "dojazd" },
 { label: "Kontakt", id: "kontakt" },
];


const IconMusicOn = () => (
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M9 18V5l12-2v13"/>
  <circle cx="6" cy="18" r="3"/>
  <circle cx="18" cy="16" r="3"/>
 </svg>
);

const IconMusicOff = () => (
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M9 18V5l12-2v13"/>
  <circle cx="6" cy="18" r="3"/>
  <circle cx="18" cy="16" r="3"/>
  <line x1="2" y1="2" x2="22" y2="22"/>
 </svg>
);

export default function NavBar({ backLabel }) {
 const [mobileOpen, setMobileOpen] = useState(false);
 const [scrolled, setScrolled] = useState(false);
 const [playing, setPlaying] = useState(false);
 const [streamActive, setStreamActive] = useState(false);
 const [nextMatch, setNextMatch] = useState(null);

 useEffect(() => {
  let cancelled = false;
  fetch("/api/liga/nextmatch")
   .then(r => r.json())
   .then(raw => {
    if (cancelled || !raw) return;
    const opp = isDrawa(raw.team1) ? raw.team2 : raw.team1;
    const oppShort = opp.replace(/^(MKS|KS|LKS|SKS|GKS|UKS|FC)\s+/i, "").split(" ")[0];
    const parts = (raw.date || "").split(" ");
    const time = parts.find(p => p.includes(":")) ?? "";
    const date = parts.filter(p => !p.includes(":")).join(" ");
    setNextMatch({ opp: oppShort, date, time });
   })
   .catch(() => {});
  return () => { cancelled = true; };
 }, []);

 useEffect(() => {
  let cancelled = false;
  function check() {
   fetch("/api/stream/url")
    .then((r) => r.json())
    .then((d) => { if (!cancelled) setStreamActive(!!d.url); })
    .catch(() => {});
  }
  check();
  const interval = setInterval(check, 30000);
  return () => { cancelled = true; clearInterval(interval); };
 }, []);

 useEffect(() => {
  const onState = (e) => setPlaying(e.detail.playing);
  window.addEventListener('audio:state', onState);
  return () => window.removeEventListener('audio:state', onState);
 }, []);

 const toggleMusic = (e) => {
  e.preventDefault();
  window.dispatchEvent(new CustomEvent('audio:toggle'));
 };

 useEffect(() => {
 const onScroll = () => setScrolled(window.scrollY > 40);
 window.addEventListener("scroll", onScroll, { passive: true });
 return () => window.removeEventListener("scroll", onScroll);
 }, []);

 const close = () => setMobileOpen(false);

 // On subpages links go to /#section, on home page to #section
 const href = (id) => backLabel ? `/#${id}` : `#${id}`;

 return (
 <>
 <nav
 style={{
 position: "fixed",
 top: 0,
 left: 0,
 right: 0,
 zIndex: 100,
 background: scrolled ? "rgba(3,7,18,0.95)" : "rgba(3,7,18,0.85)",
 backdropFilter: "blur(20px)",
 borderBottom: "1px solid rgba(255,255,255,0.06)",
 boxShadow: scrolled ? "0 2px 24px rgba(0,0,0,0.6)" : "none",
 transition: "background 0.3s, box-shadow 0.3s",
 }}
 >
 <style>{`
 @keyframes nav-pulse {
 0%, 100% { opacity: 1; transform: scale(1); }
 50% { opacity: 0.35; transform: scale(0.7); }
 }
 .nav-pulse-dot { animation: nav-pulse 1.6s ease-in-out infinite; }
 .nav-desktop-links { display: none !important; }
 .nav-hamburger { display: flex !important; }
 @media (min-width: 641px) and (min-height: 501px) {
 .nav-desktop-links { display: flex !important; }
 .nav-hamburger { display: none !important; }
 }
 `}</style>

 <div
 style={{
 maxWidth: 1200,
 margin: "0 auto",
 padding: "0 20px",
 display: "flex",
 alignItems: "center",
 justifyContent: "space-between",
 height: 64,
 }}
 >
 {/* Logo */}
 <Link href={backLabel ? "/" : "#"} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img src="/logo.png" alt="MKS Drawa" width={60} height={60} style={{ objectFit: "contain", borderRadius: 4 }} />
 <div>
 <div style={{ fontSize: 14, fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.1em", color: "#fff", lineHeight: 1 }}>
 MKS Drawa
 </div>
 <div style={{ fontSize: 9, color: "#3b82f6", letterSpacing: "0.2em" }}>DRAWNO</div>
 </div>
 </Link>

 {/* Desktop links */}
 <div className="nav-desktop-links" style={{ display: "flex", gap: 24, alignItems: "center" }}>
 {NAV_LINKS.map((l) => (
 <Link
 key={l.id}
 href={href(l.id)}
 style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.15em", textDecoration: "none", fontWeight: 600, transition: "color 0.2s" }}
 onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
 onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
 >
 {l.label.toUpperCase()}
 </Link>
 ))}
 {streamActive && (
 <Link
 href="/transmisja"
 style={{ fontSize: 11, color: "#ef4444", letterSpacing: "0.15em", textDecoration: "none", fontWeight: 700, transition: "color 0.2s", display: "flex", alignItems: "center", gap: 5 }}
 onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
 onMouseLeave={(e) => (e.currentTarget.style.color = "#ef4444")}
 >
 <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "nav-pulse 1.6s ease-in-out infinite" }} />
 TRANSMISJA
 </Link>
 )}
 <Link
 href="/login"
 style={{
 fontSize: 11,
 color: "#fff",
 letterSpacing: "0.12em",
 textDecoration: "none",
 fontWeight: 700,
 padding: "6px 14px",
 background: "rgba(59,130,246,0.15)",
 border: "1px solid rgba(59,130,246,0.4)",
 borderRadius: 20,
 transition: "background 0.2s, border-color 0.2s",
 }}
 onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.28)"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.7)"; }}
 onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.15)"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)"; }}
 >
 MÓJ MKS
 </Link>
 </div>

 {/* Right side */}
 <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
 {/* Next match pill */}
 {nextMatch && (
 <Link
 className="nav-next-match"
 href={href("mecze")}
 style={{
 display: "flex",
 alignItems: "center",
 gap: 7,
 padding: "5px 11px",
 background: "rgba(34,197,94,0.07)",
 border: "1px solid rgba(34,197,94,0.2)",
 borderRadius: 20,
 textDecoration: "none",
 }}
 >
 <div
 className="nav-pulse-dot"
 style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }}
 />
 <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
 <span style={{ fontSize: 9, color: "#22c55e", fontWeight: 700, letterSpacing: "0.08em" }}>
 {nextMatch.date} · {nextMatch.time}
 </span>
 <span style={{ fontSize: 9, color: "#475569", letterSpacing: "0.06em" }}>
 vs {nextMatch.opp}
 </span>
 </div>
 </Link>
 )}

 {/* Music toggle */}
 <button
 onClick={toggleMusic}
 aria-label={playing ? "Wycisz muzykę" : "Włącz muzykę"}
 title={playing ? "Wycisz muzykę" : "Włącz muzykę"}
 style={{
 background: playing ? "rgba(59,130,246,0.15)" : "none",
 border: `1px solid ${playing ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.1)"}`,
 borderRadius: 6,
 color: playing ? "#3b82f6" : "#475569",
 cursor: "pointer",
 padding: "6px 8px",
 lineHeight: 1,
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 transition: "background 0.2s, border-color 0.2s, color 0.2s",
 }}
 >
 {playing ? <IconMusicOn /> : <IconMusicOff />}
 </button>

 {/* Hamburger */}
 <button
 className="nav-hamburger"
 onClick={() => setMobileOpen((o) => !o)}
 aria-label="Menu"
 style={{
 background: "none",
 border: "1px solid rgba(255,255,255,0.1)",
 borderRadius: 6,
 color: "#94a3b8",
 cursor: "pointer",
 fontSize: 18,
 padding: "4px 8px",
 lineHeight: 1,
 }}
 >
 {mobileOpen ? "✕" : "☰"}
 </button>
 </div>
 </div>

 {/* Mobile dropdown */}
 {mobileOpen && (
 <div
 style={{
 background: "rgba(3,7,18,0.98)",
 borderTop: "1px solid rgba(255,255,255,0.06)",
 padding: "16px 20px 24px",
 display: "flex",
 flexDirection: "column",
 gap: 4,
 }}
 >
 {nextMatch && (
 <Link
 href={href("mecze")}
 onClick={close}
 style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", textDecoration: "none" }}
 >
 <div className="nav-pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
 <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>
 Następny mecz: {nextMatch.date} {nextMatch.time} vs {nextMatch.opp}
 </span>
 </Link>
 )}
 {NAV_LINKS.map((l) => (
 <Link
 key={l.id}
 href={href(l.id)}
 onClick={close}
 style={{ fontSize: 13, color: "#94a3b8", textDecoration: "none", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", letterSpacing: "0.1em" }}
 >
 {l.label}
 </Link>
 ))}
 {streamActive && (
 <Link
 href="/transmisja"
 onClick={close}
 style={{ fontSize: 13, color: "#ef4444", fontWeight: 700, textDecoration: "none", padding: "10px 0", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8 }}
 >
 <div className="nav-pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
 Transmisja na żywo
 </Link>
 )}
 <Link
 href="/login"
 onClick={close}
 style={{
 display: "inline-block",
 marginTop: 8,
 fontSize: 13,
 color: "#fff",
 fontWeight: 700,
 textDecoration: "none",
 padding: "10px 20px",
 background: "rgba(59,130,246,0.15)",
 border: "1px solid rgba(59,130,246,0.4)",
 borderRadius: 24,
 letterSpacing: "0.1em",
 textAlign: "center",
 }}
 >
 Mój MKS
 </Link>
 </div>
 )}
 </nav>
 </>
 );
}
