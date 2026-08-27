import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyAll } from "@/lib/pushNotify";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!(await hasAccess("liga"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const sezon = new URL(request.url).searchParams.get("sezon") || "2025/26";
  const tabela = await prisma.tabelaDruzyna.findMany({ where: { sezon }, orderBy: { pozycja: "asc" } });
  return Response.json(tabela);
}

export async function POST(request) {
  if (!(await hasAccess("liga"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { sezon = "2025/26", tabela } = await request.json();
  if (!Array.isArray(tabela) || tabela.length === 0)
    return Response.json({ error: "Brak danych tabeli" }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    await tx.tabelaDruzyna.deleteMany({ where: { sezon } });
    await tx.tabelaDruzyna.createMany({
      data: tabela.map((r, i) => {
        const [bz, bs] = (r.bramki || "0:0").split(":").map(Number);
        return {
          sezon,
          pozycja: Number(r.pozycja) || i + 1,
          nazwa: r.nazwa || r.name || "",
          herb: r.herb || r.logo || null,
          pkt: Number(r.pkt) || 0,
          mecze: Number(r.mecze) || 0,
          wygrane: Number(r.wygrane) || 0,
          remisy: Number(r.remisy) || 0,
          przegrane: Number(r.przegrane) || 0,
          bramkiZd: bz || 0,
          bramkiStr: bs || 0,
          forma: r.forma || null,
        };
      }),
    });
  });

  notifyAll({
    title: "📊 Tabela ligowa zaktualizowana",
    body: "Sprawdź aktualne pozycje w tabeli",
    url: "/liga/tabela",
    tag: `tabela-${sezon}`,
  }).catch(() => {});

  return Response.json({ ok: true, count: tabela.length });
}
