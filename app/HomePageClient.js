"use client";
import {computeTeamStats} from "@/lib/computeStats";
import {useState, useEffect} from "react";
import NavBar from "@/components/NavBar";
import Hero from "@/components/hero";
import NastepnyMecz from "@/components/nastepnyMecz";
import OstatniMecz from "@/components/ostatniMecz";
import Tabela from "@/components/tabela";
import Terminarz from "@/components/terminarz";
import Statystyki from "@/components/statystyki";
import Kadra from "@/components/kadra";
import Aktualnosci from "@/components/aktualnosci";
import Galeria from "@/components/galeria";
import Kontakt from "@/components/kontakt";
import Struktura from "@/components/struktura";
import Sponsorzy from "@/components/sponsorzy";
import Footer from "@/components/footer";
import NotificationPrompt from "@/components/NotificationPrompt";
import JakDojechac from "@/components/jakDojechac";

const DRAWA_HERB = "/logo.png";

const isDrawa = (name) => name.toLowerCase().includes("drawa");

const getFormaColor = (f) => {
  if (f === "W") return "#22c55e";
  if (f === "P") return "#ef4444";
  if (f === "R") return "#94a3b8";
  return "#334155";
};

const HerbImg = ({src, alt, size = 40}) => {
  const drawa = isDrawa(alt);
  const imgSize = drawa ? Math.max(size, 64) : size;
  // eslint-disable-next-line @next/next/no-img-element
  return <img
    src={
      drawa
        ? DRAWA_HERB
        : src?.includes("/flags/0.jpg")
          ? `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' fill='%231e293b' rx='20'/><text x='20' y='26' text-anchor='middle' font-size='18' fill='%2364748b'>?</text></svg>`
          : src
    }
    alt={alt}
    width={imgSize}
    height={imgSize}
    style={{objectFit: "contain", borderRadius: 4}}
  />;
};


const SectionLabel = ({children}) => (
  <h2 style={{display: "flex", alignItems: "center", gap: 12, margin: 0}}>
    <div style={{width: 4, height: 24, background: "#3b82f6", borderRadius: 2, boxShadow: "0 0 12px rgba(59,130,246,0.65)"}}/>
    <span
      style={{
        fontSize: "clamp(20px, 4vw, 28px)",
        fontFamily: "'Bebas Neue', Impact, sans-serif",
        letterSpacing: "0.1em",
        color: "#fff",
        fontWeight: "normal",
      }}
    >
      {children}
    </span>
  </h2>
);

const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, {passive: true});
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({top: 0, behavior: "smooth"})}
      aria-label="Powrót na górę"
      style={{
        position: "fixed",
        bottom: 28,
        right: 24,
        zIndex: 99,
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: "#1e3a5f",
        border: "1px solid rgba(59,130,246,0.4)",
        color: "#3b82f6",
        fontSize: 18,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        transition: "background 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#1d4ed8")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#1e3a5f")}
    >
      ↑
    </button>
  );
};

export default function HomePageClient({ data }) {
  const { tabela, mecze, hp } = data;

  const drawaRow = tabela.find((r) => r.nazwa?.toLowerCase().includes("drawa"));

  const heroData = {
    punkty: drawaRow?.pkt ?? 0,
    mecze: drawaRow?.mecze ?? 0,
    gole: drawaRow?.bramkiZd ?? 0,
    pozycja: drawaRow?.pozycja ?? 0,
  };

  const teamStats = computeTeamStats(mecze);

  function parseSimpleDate(str) {
    if (!str) return null;
    const MONTHS = { sty:0,lut:1,mar:2,kwi:3,maj:4,cze:5,lip:6,sie:7,wrz:8,'paź':9,lis:10,gru:11 };
    const tokens = str.replace(',','').toLowerCase().split(/\s+/);
    let day=null,month=null,year=null,h=0,m=0;
    for (const t of tokens) {
      if (/^\d{1,2}:\d{2}$/.test(t)){[h,m]=t.split(':').map(Number);continue;}
      if (/^\d{4}$/.test(t)){year=+t;continue;}
      if (/^\d{1,2}$/.test(t)){day=+t;continue;}
      const k=Object.keys(MONTHS).find(k=>t.startsWith(k));
      if(k!==undefined)month=MONTHS[k];
    }
    if(day===null||month===null)return null;
    if(year===null)year=month>=6?2025:2026;
    return new Date(year,month,day,h,m,0);
  }

  const today = new Date();
  const isMatchday = mecze.some(m => {
    if (!m.date || m.score || m.walkower) return false;
    const d = parseSimpleDate(m.date);
    return d && d.toDateString() === today.toDateString();
  });

  const MatchdayBanner = isMatchday ? () => {
    const next = mecze.find(m => !m.score && !m.walkower);
    const opp = next ? (isDrawa(next.team1) ? next.team2 : next.team1) : '';
    const time = next?.date?.split(' ').find(p => p.includes(':')) ?? '';
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))',
        borderBottom: '1px solid rgba(34,197,94,0.3)',
        padding: '10px 20px',
        textAlign: 'center',
        position: 'sticky',
        top: 64,
        zIndex: 90,
      }}>
        <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, letterSpacing: '0.15em' }}>
          ⚽ DZIŚ MECZ! &nbsp;·&nbsp; DRAWA VS {opp.toUpperCase()} &nbsp;·&nbsp; {time}
        </span>
      </div>
    );
  } : () => null;

  return (
    <>
      <style>{`
 * { box-sizing: border-box; margin: 0; padding: 0; }
 html { scroll-behavior: smooth; }
 body { background: #030712; color: #fff; font-family: -apple-system, 'Segoe UI', sans-serif; }
 ::-webkit-scrollbar { width: 6px; }
 ::-webkit-scrollbar-track { background: #0f172a; }
 ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 3px; }
 `}</style>

      <NavBar/>
      <MatchdayBanner />

      <main style={{paddingTop: 64}}>
        <Hero tabela={heroData} allTimeStats={hp?.allTimeStats} ustawienia={hp?.ustawienia}/>

        <div id="aktualnosci">
          <Aktualnosci SectionLabel={SectionLabel} data={hp?.aktualnosci}/>
        </div>

        <div id="mecze">
          <NastepnyMecz
            mecze={mecze}
            SectionLabel={SectionLabel}
            HerbImg={HerbImg}
            isDrawa={isDrawa}
          />
          <OstatniMecz
            mecze={mecze}
            SectionLabel={SectionLabel}
            HerbImg={HerbImg}
            isDrawa={isDrawa}
          />
          <Terminarz
            mecze={mecze}
            SectionLabel={SectionLabel}
            HerbImg={HerbImg}
            isDrawa={isDrawa}
          />
        </div>

        <div id="tabela">
          <Tabela
            tabela={tabela}
            SectionLabel={SectionLabel}
            HerbImg={HerbImg}
            getFormaColor={getFormaColor}
          />
        </div>


        <div id="statystyki">
          <Statystyki teamStats={teamStats} SectionLabel={SectionLabel}/>
        </div>

        <div id="galeria">
          <Galeria SectionLabel={SectionLabel} data={hp?.galeria} limit={3}/>
        </div>

        <div id="sponsorzy">
          <Sponsorzy SectionLabel={SectionLabel} data={hp?.sponsorzy}/>
        </div>

        <div id="kadra">
          <Kadra SectionLabel={SectionLabel} kadraData={hp?.kadra} showLink/>
        </div>

        <div id="struktura">
          <Struktura SectionLabel={SectionLabel} data={hp?.struktura} ustawienia={hp?.ustawienia}/>
        </div>

        <div id="dojazd">
          <JakDojechac SectionLabel={SectionLabel} />
        </div>

        <div id="kontakt">
          <Kontakt SectionLabel={SectionLabel} ustawienia={hp?.ustawienia}/>
        </div>
      </main>

      <NotificationPrompt />
      <Footer HerbImg={HerbImg} herb={DRAWA_HERB}/>
      <ScrollToTop/>
    </>
  );
}
