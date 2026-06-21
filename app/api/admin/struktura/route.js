import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAccess("struktura"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const osoby = await prisma.zarzadOsoba.findMany({
    orderBy: [{ kolejnosc: "asc" }, { createdAt: "asc" }],
  });
  return Response.json(osoby);
}

export async function POST(request) {
  if (!(await hasAccess("struktura"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { rola, imie, telefon, email, kolejnosc, aktywny } = await request.json();
  if (!imie?.trim()) return Response.json({ error: "Imię i nazwisko jest wymagane" }, { status: 400 });
  if (!rola?.trim()) return Response.json({ error: "Rola jest wymagana" }, { status: 400 });
  const osoba = await prisma.zarzadOsoba.create({
    data: {
      rola: rola.trim(),
      imie: imie.trim(),
      telefon: telefon?.trim() || null,
      email: email?.trim() || null,
      kolejnosc: Number(kolejnosc) || 0,
      aktywny: aktywny !== false,
    },
  });
  return Response.json(osoba, { status: 201 });
}
