import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const rows = await prisma.ustawienie.findMany({ orderBy: { klucz: "asc" } });
  return Response.json(Object.fromEntries(rows.map(r => [r.klucz, r.wartosc])));
}

export async function PATCH(request) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const body = await request.json();
  await Promise.all(
    Object.entries(body).map(([klucz, wartosc]) =>
      prisma.ustawienie.upsert({
        where: { klucz },
        update: { wartosc: String(wartosc) },
        create: { klucz, wartosc: String(wartosc) },
      })
    )
  );
  return Response.json({ ok: true });
}
