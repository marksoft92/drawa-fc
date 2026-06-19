"use client";

import NavBar from "@/components/NavBar";
import Galeria from "@/components/galeria";

const SectionLabel = ({ children }) => (
  <h2 style={{ display: "flex", alignItems: "center", gap: 12, margin: 0 }}>
    <div style={{ width: 4, height: 24, background: "#3b82f6", borderRadius: 2, boxShadow: "0 0 12px rgba(59,130,246,0.65)" }} />
    <span style={{ fontSize: "clamp(20px, 4vw, 28px)", fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.1em", color: "#fff", fontWeight: "normal" }}>{children}</span>
  </h2>
);

export default function GaleriaClient({ albumy }) {
  return (
    <>
      <NavBar backLabel="Strona główna" />
      <div style={{ paddingTop: 64 }}>
        <Galeria SectionLabel={SectionLabel} data={albumy} />
      </div>
    </>
  );
}
