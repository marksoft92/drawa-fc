import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  if (!(await hasAccess("komentarze"))) return Response.json({ error: "Brak dostępu" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const data = {};
  if (body.zatwierdzony !== undefined) data.zatwierdzony = !!body.zatwierdzony;
  if (body.odpowiedz !== undefined) data.odpowiedz = body.odpowiedz || null;

  const updated = await prisma.komentarz.update({ where: { id }, data });

  return Response.json(updated);
}

export async function DELETE(req, { params }) {
  if (!(await hasAccess("komentarze"))) return Response.json({ error: "Brak dostępu" }, { status: 403 });

  const { id } = await params;
  await prisma.komentarz.delete({ where: { id } }).catch(() => null);
  return Response.json({ ok: true });
}
