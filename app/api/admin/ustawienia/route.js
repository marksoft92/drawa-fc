import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_KEYS = new Set([
  "adres", "adresLink", "telefon", "telefonOpis",
  "emailKlub", "emailPrezes", "facebook", "instagram",
  "liga", "ligaLink", "ligaSezon",
  "aktywny_sezon", "aktywny_klasa", "youtube",
  "backup_email", "backup_password",
]);

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const rows = await prisma.ustawienie.findMany({ orderBy: { klucz: "asc" } });
  return Response.json(Object.fromEntries(rows.map(r => [r.klucz, r.wartosc])));
}

export async function PATCH(request) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const body = await request.json();

  const entries = Object.entries(body).filter(([klucz]) => ALLOWED_KEYS.has(klucz));
  if (entries.length === 0) {
    return Response.json({ error: "Brak dozwolonych kluczy" }, { status: 400 });
  }

  await Promise.all(
    entries.map(([klucz, wartosc]) =>
      prisma.ustawienie.upsert({
        where: { klucz },
        update: { wartosc: String(wartosc) },
        create: { klucz, wartosc: String(wartosc) },
      })
    )
  );
  return Response.json({ ok: true });
}
