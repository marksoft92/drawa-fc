import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAccess("aktualnosci"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const artykuly = await prisma.artykul.findMany({
    orderBy: { date: "desc" },
    select: { id: true, slug: true, title: true, date: true, published: true, pinned: true, tags: true },
  });
  return Response.json(artykuly);
}

export async function POST(request) {
  if (!(await hasAccess("aktualnosci"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const body = await request.json();
  const { slug, title, excerpt, content, thumbnail, kolor, tags, photos, published, pinned, date, podobne } = body;

  if (!slug?.trim() || !title?.trim()) {
    return Response.json({ error: "Slug i tytuł są wymagane" }, { status: 400 });
  }

  const exists = await prisma.artykul.findUnique({ where: { slug: slug.trim() } });
  if (exists) return Response.json({ error: "Artykuł z tym slugiem już istnieje" }, { status: 409 });

  const artykul = await prisma.artykul.create({
    data: {
      slug: slug.trim(),
      title: title.trim(),
      excerpt: excerpt?.trim() ?? "",
      content: content?.trim() ?? "",
      thumbnail: thumbnail?.trim() || null,
      kolor: kolor?.trim() || null,
      tags: Array.isArray(tags) ? tags : [],
      photos: Array.isArray(photos) ? photos : [],
      published: published ?? true,
      pinned: pinned ?? false,
      podobne: Array.isArray(podobne) ? podobne : [],
      date: date || new Date().toISOString().slice(0, 10),
    },
  });

  return Response.json(artykul, { status: 201 });
}
