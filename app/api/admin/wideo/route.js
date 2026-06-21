import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAccess("wideo"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const wideo = await prisma.wideo.findMany({ orderBy: [{ kolejnosc: "asc" }, { createdAt: "desc" }] });
  return Response.json(wideo);
}

export async function POST(request) {
  if (!(await hasAccess("wideo"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const body = await request.json();
  const { url, tytul, opis, typ, kolejnosc, published } = body;
  if (!url?.trim() || !tytul?.trim()) return Response.json({ error: "URL i tytuł są wymagane" }, { status: 400 });

  const wideo = await prisma.wideo.create({
    data: {
      url: url.trim(),
      tytul: tytul.trim(),
      opis: opis?.trim() || "",
      typ: typ || "video",
      kolejnosc: Number(kolejnosc) || 0,
      published: published ?? true,
    },
  });
  return Response.json(wideo, { status: 201 });
}
