import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import NavBar from "@/components/NavBar";
import { prisma } from "@/lib/prisma";
import PlayerProfileClient from "./PlayerProfileClient";

export const revalidate = 60;

function slugify(name) {
  return name.toLowerCase()
    .replace(/ą/g,"a").replace(/ć/g,"c").replace(/ę/g,"e").replace(/ł/g,"l")
    .replace(/ń/g,"n").replace(/ó/g,"o").replace(/ś/g,"s").replace(/ź/g,"z").replace(/ż/g,"z")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function getPlayer(slug) {
  const sezon = await prisma.sezon.findFirst({ where: { aktywny: true } });
  let allPlayers;
  if (sezon) {
    const kadraEntries = await prisma.kadraSezon.findMany({
      where: { sezonId: sezon.id },
      include: { player: { include: { stats: true } } },
    });
    allPlayers = kadraEntries.map(k => k.player);
  } else {
    allPlayers = await prisma.player.findMany({
      where: { user: { active: true } },
      include: { stats: true },
      orderBy: { imieNazwisko: "asc" },
    });
  }

  const player = allPlayers.find(p => slugify(p.imieNazwisko) === slug);
  if (!player) return null;

  const currentStats = sezon ? player.stats.find(s => s.sezonId === sezon.id) : null;
  const allSeasons = await prisma.sezon.findMany({ orderBy: { nazwa: "asc" } });
  const seasonMap = Object.fromEntries(allSeasons.map(s => [s.id, s.nazwa]));

  const seasonHistory = player.stats
    .map(s => ({
      sezon: seasonMap[s.sezonId] || "?",
      mecze: s.mecze, gole: s.gole, asysty: s.asysty,
      zolte: s.zolte, czerwone: s.czerwone,
      meczePuchar: s.meczePuchar, golePuchar: s.golePuchar,
    }))
    .sort((a, b) => a.sezon.localeCompare(b.sezon));

  const allMapped = allPlayers.map(p => {
    const st = sezon ? p.stats.find(s => s.sezonId === sezon.id) : null;
    return { imieNazwisko: p.imieNazwisko, mecze: st?.mecze ?? 0, gole: st?.gole ?? 0, asysty: st?.asysty ?? 0, zolte: st?.zolte ?? 0, czerwone: st?.czerwone ?? 0 };
  });

  return {
    player: {
      id: player.id, imieNazwisko: player.imieNazwisko, pozycja: player.pozycja,
      numer: player.numer, foto: player.foto, pseudonim: player.pseudonim,
      mecze: currentStats?.mecze ?? 0, gole: currentStats?.gole ?? 0,
      asysty: currentStats?.asysty ?? 0, zolte: currentStats?.zolte ?? 0,
      czerwone: currentStats?.czerwone ?? 0,
      meczePuchar: currentStats?.meczePuchar ?? 0, golePuchar: currentStats?.golePuchar ?? 0,
    },
    sezon: sezon?.nazwa ?? null,
    seasonHistory,
    allPlayers: allMapped,
  };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getPlayer(slug);
  if (!data) return {};
  const { player, sezon } = data;
  return {
    title: `${player.imieNazwisko} — ${player.pozycja || 'Zawodnik'} MKS Drawa Drawno`,
    description: `Profil zawodnika ${player.imieNazwisko}. ${player.pozycja || 'Zawodnik'} MKS Drawa Drawno. ${sezon ? `Sezon ${sezon}: ` : ''}${player.gole} goli, ${player.asysty} asyst w ${player.mecze} meczach.`,
    alternates: { canonical: `https://mksdrawadrawno.pl/kadra/${slug}` },
    openGraph: {
      title: `${player.imieNazwisko} — MKS Drawa Drawno`,
      description: `${player.pozycja || 'Zawodnik'} · ${player.gole} goli, ${player.asysty} asyst, ${player.mecze} meczów`,
      images: player.foto ? [{ url: player.foto }] : [{ url: "/logo.png" }],
    },
  };
}

export default async function PlayerPage({ params }) {
  const { slug } = await params;
  const data = await getPlayer(slug);
  if (!data) notFound();

  const { player, sezon, seasonHistory, allPlayers } = data;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
        {
          "@context": "https://schema.org",
          "@type": "Person",
          name: player.imieNazwisko,
          jobTitle: player.pozycja || "Zawodnik",
          memberOf: { "@type": "SportsTeam", name: "MKS Drawa Drawno", url: "https://mksdrawadrawno.pl" },
          image: player.foto ? `https://mksdrawadrawno.pl${player.foto}` : undefined,
          url: `https://mksdrawadrawno.pl/kadra/${slug}`,
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Strona główna", item: "https://mksdrawadrawno.pl" },
            { "@type": "ListItem", position: 2, name: "Kadra", item: "https://mksdrawadrawno.pl/kadra" },
            { "@type": "ListItem", position: 3, name: player.imieNazwisko },
          ],
        },
      ]) }} />

      <NavBar backLabel="← Kadra" />

      <main style={{ paddingTop: 64, background: '#030712', minHeight: '100vh' }}>
        <PlayerProfileClient
          player={JSON.parse(JSON.stringify(player))}
          sezon={sezon}
          seasonHistory={JSON.parse(JSON.stringify(seasonHistory))}
          allPlayers={JSON.parse(JSON.stringify(allPlayers))}
        />
      </main>
    </>
  );
}
