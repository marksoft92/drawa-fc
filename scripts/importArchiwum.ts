// @ts-nocheck
import "dotenv/config";
import { prisma } from "../lib/prisma";
import ligowiecData from "../tmp/archiwum_ligowiec.json";
import min90Data from "../tmp/archiwum_90minut.json";

const tabelaOnlyIds = new Set([92600, 93219]);
const data = [...min90Data.filter((s) => !tabelaOnlyIds.has(s.sourceId)), ...ligowiecData];
const tabelaSupplements = min90Data.filter((s) => tabelaOnlyIds.has(s.sourceId));

async function main() {
  console.log(`\nImport archiwum: ${data.length} sezonów + ${tabelaSupplements.length} uzupełnień tabel\n`);

  for (const s of data) {
    if (s.error) {
      console.log(`⏭  ID ${s.sourceId} — pominięto (błąd scrapera)`);
      continue;
    }

    const sezon = await prisma.archiwumSezon.upsert({
      where: { sourceId: s.sourceId },
      create: { sourceId: s.sourceId, sezon: s.sezon, liga: s.liga, sourceUrl: s.sourceUrl },
      update: { sezon: s.sezon, liga: s.liga, sourceUrl: s.sourceUrl },
    });

    await prisma.archiwumMecz.deleteMany({ where: { sezonId: sezon.id } });
    await prisma.archiwumTabela.deleteMany({ where: { sezonId: sezon.id } });

    if (s.mecze?.length) {
      await prisma.archiwumMecz.createMany({
        data: s.mecze.map((m) => ({
          sezonId: sezon.id,
          kolejka: m.kolejka ?? null,
          date: m.date,
          team1: m.team1,
          team2: m.team2,
          score: m.score,
        })),
      });
    }

    const validTabela = (s.tabela || []).filter(
      (t) => t.pozycja > 0 && t.pozycja < 100 && t.nazwa && !t.nazwa.includes("Klasa") && !t.nazwa.includes("Liga") && !t.bramki?.includes("+/-")
    );
    if (validTabela.length) {
      await prisma.archiwumTabela.createMany({
        data: validTabela.map((t) => ({
          sezonId: sezon.id, pozycja: t.pozycja, nazwa: t.nazwa, mecze: t.mecze,
          pkt: t.pkt, wygrane: t.wygrane, remisy: t.remisy, przegrane: t.przegrane, bramki: t.bramki,
        })),
      });
    }

    console.log(`✅ ${s.sezon || "?"} ${s.liga} — ${s.mecze?.length || 0} meczów, ${validTabela.length} w tabeli`);
  }

  for (const sup of tabelaSupplements) {
    const existing = await prisma.archiwumSezon.findFirst({
      where: { sezon: sup.sezon, NOT: { liga: { contains: "Puchar" } } },
      include: { tabela: true },
    });
    if (!existing) {
      console.log(`⏭  Tabela ${sup.sezon} — nie znaleziono sezonu do uzupełnienia`);
      continue;
    }
    if (existing.tabela.length > 0) {
      console.log(`⏭  Tabela ${sup.sezon} — sezon ${existing.liga} ma już tabelę (${existing.tabela.length} drużyn)`);
      continue;
    }

    const validTabela = (sup.tabela || []).filter(
      (t) => t.pozycja > 0 && t.pozycja < 100 && t.nazwa && !t.bramki?.includes("+/-")
    );
    if (validTabela.length) {
      await prisma.archiwumTabela.createMany({
        data: validTabela.map((t) => ({
          sezonId: existing.id, pozycja: t.pozycja, nazwa: t.nazwa, mecze: t.mecze,
          pkt: t.pkt, wygrane: t.wygrane, remisy: t.remisy, przegrane: t.przegrane, bramki: t.bramki,
        })),
      });
      console.log(`📊 ${sup.sezon} — uzupełniono tabelę (${validTabela.length} drużyn) dla ${existing.liga}`);
    }
  }

  console.log("\n✅ Import zakończony\n");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
