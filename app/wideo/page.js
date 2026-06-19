import { prisma } from "@/lib/prisma";
import WideoClient from "./WideoClient";

export const revalidate = 60;

export default async function WideoPage() {
  const [filmy, ustawienia] = await Promise.all([
    prisma.wideo.findMany({ where: { published: true }, orderBy: [{ kolejnosc: "asc" }, { createdAt: "desc" }] }),
    prisma.ustawienie.findMany(),
  ]);
  const ust = Object.fromEntries(ustawienia.map(r => [r.klucz, r.wartosc]));

  return (
    <>
      <h1 style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", borderWidth: 0 }}>
        Wideo MKS Drawa Drawno
      </h1>
      <WideoClient filmy={JSON.parse(JSON.stringify(filmy))} youtubeUrl={ust.youtube || "https://www.youtube.com/@MKS_DRAWA_DRAWNO"} />
    </>
  );
}
