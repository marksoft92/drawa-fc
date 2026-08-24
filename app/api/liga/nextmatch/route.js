import { prisma } from "@/lib/prisma";
import { meczSortKeyAsc, isMeczUpcoming } from "@/lib/parseMeczDate";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await prisma.ustawienie.findUnique({ where: { klucz: "aktywny_sezon" } });
  const sezon = u?.wartosc || "2025/26";
  // "date" to string w polskim formacie — sortowanie po nim w bazie byłoby
  // leksykograficzne, nie chronologiczne, więc bierzemy wszystkie i sortujemy w JS
  const mecze = await prisma.mecz.findMany({
    where: { sezon, score: null, walkower: false },
  });
  // score:null nie gwarantuje, że mecz jest w przyszłości — zdarzają się
  // nieaktualne rekordy sprzed korekty terminarza z datą już z przeszłości
  const mecz = [...mecze].filter(isMeczUpcoming).sort((a, b) => meczSortKeyAsc(a.date) - meczSortKeyAsc(b.date))[0] ?? null;
  if (!mecz) return Response.json(null, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  return Response.json(mecz, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
