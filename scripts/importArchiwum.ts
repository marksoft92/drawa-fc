// @ts-nocheck
import "dotenv/config";
import { prisma } from "../lib/prisma";
import data from "../tmp/archiwum_ligowiec.json";

async function main() {
  console.log(`\nImport archiwum: ${data.length} sezonów\n`);

  for (const s of data) {
    if (s.error) {
      console.log(`⏭  ID ${s.sourceId} — pominięto (błąd scrapera)`);
      continue;
    }

    const sezon = await prisma.archiwumSezon.upsert({
      where: { sourceId: s.sourceId },
      create: {
        sourceId: s.sourceId,
        sezon: s.sezon,
        liga: s.liga,
        sourceUrl: s.sourceUrl,
      },
      update: { sezon: s.sezon, liga: s.liga, sourceUrl: s.sourceUrl },
    });

    await prisma.archiwumMecz.deleteMany({ where: { sezonId: sezon.id } });
    await prisma.archiwumTabela.deleteMany({ where: { sezonId: sezon.id } });

    if (s.mecze?.length) {
      await prisma.archiwumMecz.createMany({
        data: s.mecze.map((m: any) => ({
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
      (t: any) => t.pozycja > 0 && t.pozycja < 100 && t.nazwa && !t.nazwa.includes("Klasa") && !t.nazwa.includes("Liga") && !t.bramki?.includes("+/-")
    );
    if (validTabela.length) {
      await prisma.archiwumTabela.createMany({
        data: validTabela.map((t: any) => ({
          sezonId: sezon.id,
          pozycja: t.pozycja,
          nazwa: t.nazwa,
          mecze: t.mecze,
          pkt: t.pkt,
          wygrane: t.wygrane,
          remisy: t.remisy,
          przegrane: t.przegrane,
          bramki: t.bramki,
        })),
      });
    }

    console.log(`✅ ${s.sezon || "?"} ${s.liga} — ${s.mecze?.length || 0} meczów, ${s.tabela?.length || 0} w tabeli`);
  }

  console.log("\n✅ Import zakończony\n");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
