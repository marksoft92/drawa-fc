import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/ą/g, "a").replace(/ć/g, "c").replace(/ę/g, "e")
    .replace(/ł/g, "l").replace(/ń/g, "n").replace(/ó/g, "o")
    .replace(/ś/g, "s").replace(/ź/g, "z").replace(/ż/g, "z")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function PATCH(request, { params }) {
  if (!(await hasAccess("zrodla"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const data = {};
  if (body.tytul !== undefined) {
    data.tytul = body.tytul.trim();
    if (!body.slug) data.slug = slugify(data.tytul) + "-" + id.slice(-6);
  }
  if (body.slug !== undefined) data.slug = body.slug.trim();
  if (body.tresc !== undefined) data.tresc = body.tresc;
  if (body.miniaturka !== undefined) data.miniaturka = body.miniaturka?.trim() || null;
  if (body.published !== undefined) {
    const wpis = await prisma.wpisLigowy.findUnique({ where: { id } });
    if (body.published && (!wpis?.tytul && !data.tytul)) {
      return Response.json({ error: "Tytuł jest wymagany do publikacji" }, { status: 400 });
    }
    data.published = body.published;
  }
  const wpis = await prisma.wpisLigowy.update({ where: { id }, data });
  return Response.json(wpis);
}

export async function DELETE(request, { params }) {
  if (!(await hasAccess("zrodla"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  await prisma.wpisLigowy.delete({ where: { id } });
  return Response.json({ ok: true });
}
