import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const data = {};
  if (body.nazwa !== undefined) data.nazwa = body.nazwa.trim();
  if (body.logo !== undefined) data.logo = body.logo?.trim() || null;
  if (body.href !== undefined) data.href = body.href?.trim() || null;
  if (body.kolejnosc !== undefined) data.kolejnosc = Number(body.kolejnosc) || 0;
  if (body.aktywny !== undefined) data.aktywny = body.aktywny;
  const sponsor = await prisma.sponsor.update({ where: { id }, data });
  return Response.json(sponsor);
}

export async function DELETE(request, { params }) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  await prisma.sponsor.delete({ where: { id } });
  return Response.json({ ok: true });
}
