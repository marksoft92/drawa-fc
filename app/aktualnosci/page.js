"use client";

import NavBar from "@/components/NavBar";
import Aktualnosci from "@/components/aktualnosci";

const SectionLabel = ({ children }) => (
 <h2 style={{ display: "flex", alignItems: "center", gap: 12, margin: 0 }}>
 <div style={{ width: 4, height: 24, background: "#3b82f6", borderRadius: 2 }} />
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

export default function AktualnosciPage() {
 return (
 <>
 <style>{`
 @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
 * { box-sizing: border-box; margin: 0; padding: 0; }
 body { background: #030712; color: #fff; font-family: -apple-system, 'Segoe UI', sans-serif; }
 `}</style>

 <NavBar backLabel="Strona główna" />

 <div style={{ paddingTop: 64 }}>
 <Aktualnosci SectionLabel={SectionLabel} showAll={true} />
 </div>
 </>
 );
}
