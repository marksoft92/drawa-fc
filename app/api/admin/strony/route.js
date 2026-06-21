import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAccess("strony"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const strony = await prisma.strona.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json(strony);
}

export async function POST(request) {
  if (!(await hasAccess("strony"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { slug, tytul, tresc, metaOpis, published } = await request.json();
  if (!slug?.trim() || !tytul?.trim()) return Response.json({ error: "Slug i tytuł wymagane" }, { status: 400 });

  const exists = await prisma.strona.findUnique({ where: { slug: slug.trim() } });
  if (exists) return Response.json({ error: "Strona z tym slugiem już istnieje" }, { status: 409 });

  const strona = await prisma.strona.create({
    data: { slug: slug.trim(), tytul: tytul.trim(), tresc: tresc?.trim() || "", metaOpis: metaOpis?.trim() || null, published: published ?? true },
  });
  return Response.json(strona, { status: 201 });
}
