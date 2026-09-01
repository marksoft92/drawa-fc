import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUSY = ["NOWY", "KONTAKT", "NEGOCJACJE", "PODPISANE", "ODRZUCONE"];

export async function PATCH(request, { params }) {
  if (!(await hasAccess("sponsorzy"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();

  if (body.status !== undefined && !STATUSY.includes(body.status)) {
    return Response.json({ error: "Nieznany status" }, { status: 400 });
  }

  const data = {};
  if (body.nazwa !== undefined) data.nazwa = body.nazwa.trim();
  if (body.osobaKontaktowa !== undefined) data.osobaKontaktowa = body.osobaKontaktowa?.trim() || null;
  if (body.telefon !== undefined) data.telefon = body.telefon?.trim() || null;
  if (body.email !== undefined) data.email = body.email?.trim() || null;
  if (body.www !== undefined) data.www = body.www?.trim() || null;
  if (body.adres !== undefined) data.adres = body.adres?.trim() || null;
  if (body.zrodlo !== undefined) data.zrodlo = body.zrodlo?.trim() || null;
  if (body.status !== undefined) data.status = body.status;
  if (body.wartosc !== undefined) data.wartosc = body.wartosc === "" || body.wartosc === null ? null : Number(body.wartosc) || null;
  if (body.nastepnyKontakt !== undefined) data.nastepnyKontakt = body.nastepnyKontakt ? new Date(body.nastepnyKontakt) : null;

  const lead = await prisma.sponsorLead.update({ where: { id }, data });
  return Response.json(lead);
}

export async function DELETE(request, { params }) {
  if (!(await hasAccess("sponsorzy"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  await prisma.sponsorLead.delete({ where: { id } });
  return Response.json({ ok: true });
}
