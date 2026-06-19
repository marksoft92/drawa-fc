import NavBar from "@/components/NavBar";
import Galeria from "@/components/galeria";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

const SectionLabel = ({ children }) => (
  <h2 style={{ display: "flex", alignItems: "center", gap: 12, margin: 0 }}>
    <div style={{ width: 4, height: 24, background: "#3b82f6", borderRadius: 2, boxShadow: "0 0 12px rgba(59,130,246,0.65)" }} />
    <span style={{ fontSize: "clamp(20px, 4vw, 28px)", fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.1em", color: "#fff", fontWeight: "normal" }}>{children}</span>
  </h2>
);

export default async function GaleriaPage() {
  const albumy = await prisma.album.findMany({
    where: { published: true },
    orderBy: [{ kolejnosc: "asc" }, { date: "desc" }],
  });

  return (
    <>
      <NavBar backLabel="Strona główna" />
      <div style={{ paddingTop: 64 }}>
        <h1 style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", borderWidth: 0 }}>
          Galeria zdjęć MKS Drawa Drawno
        </h1>
        <Galeria SectionLabel={SectionLabel} data={JSON.parse(JSON.stringify(albumy))} />
      </div>
    </>
  );
}
