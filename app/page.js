"use client";
import data from "@/lib/drawa_data_b_klasa_2025_2026";
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

// ─── Helpers ─────────────────────────────────────────────────

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
  <div style={{display: "flex", alignItems: "center", gap: 12}}>
    <div style={{width: 4, height: 24, background: "#3b82f6", borderRadius: 2, boxShadow: "0 0 12px rgba(59,130,246,0.65)"}}/>
    <div
      style={{
        fontSize: "clamp(20px, 4vw, 28px)",
        fontFamily: "'Bebas Neue', Impact, sans-serif",
        letterSpacing: "0.1em",
        color: "#fff",
      }}
    >
      {children}
    </div>
  </div>
);

// ─── Scroll to top ────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────

export default function Page() {
  const drawaRow = (data.tabela)?.find((r) =>
    r.nazwa.toLowerCase().includes("drawa")
  );

  const heroData = {
    punkty: parseInt(drawaRow?.pkt ?? "0"),
    mecze: parseInt(drawaRow?.mecze ?? "0"),
    gole: parseInt((drawaRow?.bramki ?? "0:0").split(":")[0]),
    pozycja: parseInt(drawaRow?.pozycja ?? "0"),
  };

  const teamStats = computeTeamStats(data.mecze);

  return (
    <>
      <style>{`
 @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
 * { box-sizing: border-box; margin: 0; padding: 0; }
 html { scroll-behavior: smooth; }
 body { background: #030712; color: #fff; font-family: -apple-system, 'Segoe UI', sans-serif; }
 ::-webkit-scrollbar { width: 6px; }
 ::-webkit-scrollbar-track { background: #0f172a; }
 ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 3px; }
 `}</style>

      <NavBar/>

      <main style={{paddingTop: 64}}>
        <Hero tabela={heroData}/>

        <div id="aktualnosci">
          <Aktualnosci SectionLabel={SectionLabel}/>
        </div>

        <div id="mecze">
          <NastepnyMecz
            mecze={data.mecze}
            SectionLabel={SectionLabel}
            HerbImg={HerbImg}
            isDrawa={isDrawa}
          />
          <OstatniMecz
            mecze={data.mecze}
            SectionLabel={SectionLabel}
            HerbImg={HerbImg}
            isDrawa={isDrawa}
          />
          <Terminarz
            mecze={data.mecze}
            SectionLabel={SectionLabel}
            HerbImg={HerbImg}
            isDrawa={isDrawa}
          />
        </div>

        <div id="tabela">
          <Tabela
            tabela={data.tabela}
            SectionLabel={SectionLabel}
            HerbImg={HerbImg}
            getFormaColor={getFormaColor}
          />
        </div>

        <div id="statystyki">
          <Statystyki teamStats={teamStats} SectionLabel={SectionLabel}/>
        </div>

        <div id="galeria">
          <Galeria SectionLabel={SectionLabel}/>
        </div>

        <div id="sponsorzy">
          <Sponsorzy SectionLabel={SectionLabel}/>
        </div>

        <div id="kadra">
          <Kadra SectionLabel={SectionLabel}/>
        </div>

        <div id="struktura">
          <Struktura SectionLabel={SectionLabel}/>
        </div>

        <div id="kontakt">
          <Kontakt SectionLabel={SectionLabel}/>
        </div>
      </main>

      <NotificationPrompt />
      <Footer HerbImg={HerbImg} herb={DRAWA_HERB}/>
      <ScrollToTop/>
    </>
  );
}
