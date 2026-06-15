import { prisma } from '@/lib/prisma';
import { computeTeamStats } from '@/lib/computeStats';

export const dynamic = 'force-dynamic';

async function buildSystemPrompt() {
  const u = await prisma.ustawienie.findUnique({ where: { klucz: 'aktywny_sezon' } });
  const aktywnySezon = u?.wartosc || '2025/26';

  const [tabela, mecze, sezon] = await Promise.all([
    prisma.tabelaDruzyna.findMany({ where: { sezon: aktywnySezon }, orderBy: { pozycja: 'asc' } }),
    prisma.mecz.findMany({ where: { sezon: aktywnySezon }, orderBy: { createdAt: 'asc' } }),
    prisma.sezon.findUnique({ where: { nazwa: aktywnySezon } }),
  ]);

  const drawaRow = tabela.find(r => r.nazwa.toLowerCase().includes('drawa'));
  const stats = computeTeamStats(mecze);

  const last5 = stats.allResults.slice(-5).map(r =>
    `${r.result === 'W' ? 'W' : r.result === 'D' ? 'R' : 'P'} ${r.score} vs ${r.opponent}`
  ).join(', ');

  const nextMatch = mecze.find(m => !m.score && !m.walkower);
  const nextOpp = nextMatch ? (nextMatch.team1.toLowerCase().includes('drawa') ? nextMatch.team2 : nextMatch.team1) : null;

  let rosterLines = '';
  if (sezon) {
    const playerStats = await prisma.sezonStats.findMany({
      where: { sezonId: sezon.id },
      include: { player: true },
    });
    rosterLines = playerStats.map(ps => {
      const parts = [ps.player.imieNazwisko];
      if (ps.player.pseudonim) parts.push(`ps. "${ps.player.pseudonim}"`);
      parts.push(ps.player.pozycja || '');
      parts.push(`${ps.mecze} meczów`);
      parts.push(`${ps.gole} goli`);
      if (ps.asysty) parts.push(`${ps.asysty} asyst`);
      if (ps.zolte > 0) parts.push(`${ps.zolte} żółtych`);
      if (ps.czerwone > 0) parts.push(`${ps.czerwone} czerwonych`);
      return parts.join(' | ');
    }).join('\n');
  }

  return `Jesteś asystentem kibiców MKS Drawa Drawno — klubu piłkarskiego z Drawna grającego w Klasie B Zachodniopomorskiej sezon ${aktywnySezon}. ZAWSZE odpowiadaj wyłącznie po polsku, niezależnie od języka pytania. Nigdy nie używaj innego języka niż polski. Odpowiadaj konkretnie i z entuzjazmem. Jesteś fanem klubu.

TABELA (sezon ${aktywnySezon}):
Pozycja: ${drawaRow?.pozycja ?? '?'}. miejsce | Punkty: ${drawaRow?.pkt ?? '?'} | Mecze: ${drawaRow?.mecze ?? '?'} | Bramki: ${drawaRow ? `${drawaRow.bramkiZd}:${drawaRow.bramkiStr}` : '?'}
Bilans: ${stats.wins}W ${stats.draws}R ${stats.losses}P | Dom: ${stats.homeWins}W ${stats.homeDraws}R ${stats.homeLosses}P | Wyjazd: ${stats.awayWins}W ${stats.awayDraws}R ${stats.awayLosses}P

STATYSTYKI SEZONU:
- Gole strzelone/stracone: ${stats.golesFor}:${stats.golesAgainst} (śr. ${stats.avgGolesFor}/mecz strzelenych)
- Najdłuższa seria zwycięstw: ${stats.longestWinStreak} meczów
- Seria bez porażki: ${stats.unbeatenStreak} meczów
- Czyste konta: ${stats.cleanSheets} | Mecze bez gola: ${stats.failedToScore}
- Największa wygrana: ${stats.biggestWin.score} z ${stats.biggestWin.opponent}
- Comebacki (odrobione straty): ${stats.comebacks}
- Kartki: ${stats.yellowCards} żółtych, ${stats.redCards} czerwonych
- Ostatnie 5 wyników: ${last5}
${nextOpp ? `- Następny mecz: vs ${nextOpp} (${nextMatch.date})` : ''}
${rosterLines ? `\nKADRA:\n${rosterLines}` : ''}

Odpowiadaj na pytania o klub, zawodników, wyniki, statystyki i piłkę nożną. Gdy pytają o konkretnego zawodnika — podaj jego statystyki. Gdy pytają o szanse na awans — uwzględnij pozycję w tabeli.`;
}

export async function POST(req) {
  const { messages, model } = await req.json();

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'Brak klucza OPENROUTER_API_KEY' }, { status: 500 });
  }

  const systemPrompt = await buildSystemPrompt();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://mksdrawadrawno.pl',
      'X-Title': 'MKS Drawa Chat',
    },
    body: JSON.stringify({
      model: model || 'google/gemma-4-31b-it:free',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    let msg = 'Błąd API';
    try {
      const parsed = JSON.parse(err);
      const code = parsed?.error?.code ?? response.status;
      if (code === 404) msg = 'Model niedostępny — zmień model w prawym górnym rogu';
      else if (code === 429) msg = 'Limit zapytań wyczerpany — spróbuj za chwilę';
      else if (code === 401) msg = 'Błąd autoryzacji — nieprawidłowy klucz API';
      else msg = parsed?.error?.message ?? 'Nieznany błąd';
    } catch {}
    return Response.json({ error: msg }, { status: response.status });
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
