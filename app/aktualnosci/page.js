import NavBar from "@/components/NavBar";
import Aktualnosci from "@/components/aktualnosci";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

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

export default async function AktualnosciPage() {
 const artykuly = await prisma.artykul.findMany({
   where: { published: true },
   orderBy: { date: "desc" },
   select: {
     id: true, slug: true, title: true, excerpt: true,
     thumbnail: true, kolor: true, tags: true, date: true, pinned: true,
   },
 });

 return (
 <>
 <NavBar backLabel="Strona główna" />

 <div style={{ paddingTop: 64 }}>
 <h1 style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", borderWidth: 0 }}>
   Aktualności MKS Drawa Drawno
 </h1>
 <Aktualnosci SectionLabel={SectionLabel} showAll={true} data={JSON.parse(JSON.stringify(artykuly))} />
 </div>
 </>
 );
}
