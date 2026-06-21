import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAccess("galeria"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const albumy = await prisma.album.findMany({
    orderBy: [{ kolejnosc: "asc" }, { date: "desc" }],
    select: { id: true, slug: true, tytul: true, date: true, tags: true, thumbnail: true, published: true, kolejnosc: true, photos: true },
  });
  return Response.json(albumy);
}

export async function POST(request) {
  if (!(await hasAccess("galeria"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const body = await request.json();
  if (!body.tytul?.trim()) return Response.json({ error: "Tytuł jest wymagany" }, { status: 400 });
  if (!body.slug?.trim()) return Response.json({ error: "Slug jest wymagany" }, { status: 400 });
  const album = await prisma.album.create({
    data: {
      slug: body.slug.trim(),
      tytul: body.tytul.trim(),
      date: body.date || new Date().toISOString().slice(0, 10),
      tags: Array.isArray(body.tags) ? body.tags : [],
      thumbnail: body.thumbnail?.trim() || null,
      author: body.author?.trim() || null,
      hrefAuthor: body.hrefAuthor?.trim() || null,
      photos: Array.isArray(body.photos) ? body.photos : [],
      kolejnosc: Number(body.kolejnosc) || 0,
      published: body.published !== false,
    },
  });
  return Response.json(album, { status: 201 });
}
