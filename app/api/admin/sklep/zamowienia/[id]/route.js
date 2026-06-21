import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  if (!(await hasAccess("sklep"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const zam = await prisma.zamowienie.findUnique({
    where: { id },
    include: { pozycje: { include: { produkt: { select: { id: true, nazwa: true, zdjecia: true } } } } },
  });
  if (!zam) return Response.json({ error: "Nie znaleziono" }, { status: 404 });
  return Response.json(zam);
}

export async function PATCH(request, { params }) {
  if (!(await hasAccess("sklep"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const { status } = await request.json();
  const VALID = ["nowe", "potwierdzone", "wysłane", "zakończone", "anulowane"];
  if (!VALID.includes(status)) return Response.json({ error: "Nieprawidłowy status" }, { status: 400 });

  const zam = await prisma.zamowienie.update({ where: { id }, data: { status } });
  return Response.json(zam);
}
