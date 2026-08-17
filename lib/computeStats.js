import { meczSortKeyAsc } from './parseMeczDate';

function isDrawaTeam(name) {
  return name && name.toLowerCase().includes('drawa');
}

export function computeTeamStats(mecze) {
  const ligaMecze = mecze
    .filter((m) => !(m.liga?.includes('Puchar Polski')) && m.status !== 'planowany')
    .sort((a, b) => meczSortKeyAsc(a.date) - meczSortKeyAsc(b.date));

  let wins = 0, draws = 0, losses = 0;
  let homeWins = 0, homeDraws = 0, homeLosses = 0;
  let awayWins = 0, awayDraws = 0, awayLosses = 0;
  let golesFor = 0, golesAgainst = 0;
  let cleanSheets = 0, failedToScore = 0;
  let longestWinStreak = 0, currentWinStreak = 0;
  let biggestWin = { score: '', opponent: '', diff: 0 };
  let biggestLoss = { score: '', opponent: '', diff: 0 };
  let mostGoalsMatch = { total: 0, score: '', opponent: '' };

  const goalsByMinute = { '1-15': 0, '16-30': 0, '31-45': 0, '46-60': 0, '61-75': 0, '76-90': 0, '90+': 0 };
  const concededByMinute = { '1-15': 0, '16-30': 0, '31-45': 0, '46-60': 0, '61-75': 0, '76-90': 0, '90+': 0 };
  let golesH1 = 0, golesH2 = 0;

  let scoredFirstCount = 0, scoredFirstWins = 0;
  let comebacks = 0;
  let yellowCards = 0, redCards = 0;
  const cardsByPlayer = {};

  // HT/FT: key = htResult+ftResult (e.g. 'WW', 'LD')
  const htFt = { WW: 0, WD: 0, WL: 0, DW: 0, DD: 0, DL: 0, LW: 0, LD: 0, LL: 0 };

  // Monthly form
  const byMonth = {};

  // Scoreline frequency
  const scorelines = {};

  // Multi-goal games per player
  const multiGoalGames = {};

  const playedResults = [];

  for (const m of ligaMecze) {
    if (!m.score) continue;
    const [s1, s2] = m.score.split(':').map(Number);
    if (isNaN(s1) || isNaN(s2)) continue;

    const home = isDrawaTeam(m.team1);
    const drawaSide = home ? 'gospodarze' : 'goscie';
    const gf = home ? s1 : s2;
    const ga = home ? s2 : s1;
    const opp = home ? m.team2 : m.team1;
    const diff = gf - ga;
    const result = diff > 0 ? 'W' : diff < 0 ? 'L' : 'D';

    golesFor += gf;
    golesAgainst += ga;
    if (ga === 0) cleanSheets++;
    if (gf === 0) failedToScore++;

    const matchTotal = s1 + s2;
    if (matchTotal > mostGoalsMatch.total) {
      mostGoalsMatch = { total: matchTotal, score: `${gf}:${ga}`, opponent: opp };
    }

    playedResults.push({ result, date: m.date ?? '', score: `${gf}:${ga}`, opponent: opp });

    // scoreline frequency
    const line = `${gf}:${ga}`;
    scorelines[line] = (scorelines[line] ?? 0) + 1;

    // monthly form
    const month = m.date?.split(' ')?.[1] ?? '?';
    if (!byMonth[month]) byMonth[month] = { W: 0, D: 0, L: 0 };
    byMonth[month][result]++;

    if (result === 'W') {
      wins++;
      currentWinStreak++;
      if (currentWinStreak > longestWinStreak) longestWinStreak = currentWinStreak;
      if (diff > biggestWin.diff) biggestWin = { score: `${gf}:${ga}`, opponent: opp, diff };
    } else {
      currentWinStreak = 0;
    }
    if (result === 'D') draws++;
    if (result === 'L') {
      losses++;
      if (-diff > biggestLoss.diff) biggestLoss = { score: `${gf}:${ga}`, opponent: opp, diff: -diff };
    }

    if (home) {
      if (result === 'W') homeWins++;
      else if (result === 'L') homeLosses++;
      else homeDraws++;
    } else {
      if (result === 'W') awayWins++;
      else if (result === 'L') awayLosses++;
      else awayDraws++;
    }

    if (!m.wszystkieZdarzenia?.length) continue;

    // goals scored & conceded by minute + HT score
    let htGf = 0, htGa = 0;
    for (const z of m.wszystkieZdarzenia) {
      if (z.typ !== 'gol' && z.typ !== 'samobój') continue;
      const min = parseInt(z.minuta);
      const isDrawaGoal = z.strona === drawaSide;

      if (isDrawaGoal) {
        if (!isNaN(min)) {
          if (min <= 15) goalsByMinute['1-15']++;
          else if (min <= 30) goalsByMinute['16-30']++;
          else if (min <= 45) goalsByMinute['31-45']++;
          else if (min <= 60) goalsByMinute['46-60']++;
          else if (min <= 75) goalsByMinute['61-75']++;
          else if (min <= 90) goalsByMinute['76-90']++;
          else goalsByMinute['90+']++;
          if (min <= 45) { golesH1++; htGf++; }
          else golesH2++;
        }
      } else {
        if (!isNaN(min)) {
          if (min <= 15) concededByMinute['1-15']++;
          else if (min <= 30) concededByMinute['16-30']++;
          else if (min <= 45) concededByMinute['31-45']++;
          else if (min <= 60) concededByMinute['46-60']++;
          else if (min <= 75) concededByMinute['61-75']++;
          else if (min <= 90) concededByMinute['76-90']++;
          else concededByMinute['90+']++;
          if (min <= 45) htGa++;
        }
      }
    }

    const htResult = htGf > htGa ? 'W' : htGf < htGa ? 'L' : 'D';
    const htFtKey = htResult + result;
    if (htFtKey in htFt) htFt[htFtKey]++;

    // multi-goal games
    const drawaSklad = m.sklady?.[drawaSide];
    const allPlayers = [...(drawaSklad?.pierwsza11 ?? []), ...(drawaSklad?.rezerwa ?? [])];
    for (const p of allPlayers) {
      if ((p.gole_w_meczu ?? 0) >= 2) {
        multiGoalGames[p.nazwisko] = (multiGoalGames[p.nazwisko] ?? 0) + 1;
      }
    }

    // scored first
    const firstGoal = m.wszystkieZdarzenia.find((z) => z.typ === 'gol' || z.typ === 'samobój');
    if (firstGoal?.strona === drawaSide) {
      scoredFirstCount++;
      if (result === 'W') scoredFirstWins++;
    }

    // comebacks (were trailing at some point, didn't lose)
    if (result !== 'L') {
      let drawaG = 0, oppG = 0;
      let wasTrailing = false;
      for (const z of m.wszystkieZdarzenia) {
        if (z.typ !== 'gol' && z.typ !== 'samobój') continue;
        if (z.strona === drawaSide) drawaG++; else oppG++;
        if (oppG > drawaG) wasTrailing = true;
      }
      if (wasTrailing) comebacks++;
    }

    // discipline
    for (const z of m.wszystkieZdarzenia) {
      if (z.strona !== drawaSide) continue;
      if (z.typ === 'żółta kartka') {
        yellowCards++;
        cardsByPlayer[z.zawodnik] = (cardsByPlayer[z.zawodnik] ?? 0) + 1;
      }
      if (z.typ === 'czerwona kartka' || z.typ === 'czerwona kartka (drugi żółty)') {
        redCards++;
      }
    }
  }

  // unbeaten streak (current, from end)
  let unbeatenStreak = 0;
  let unbeatenSince = '';
  for (let i = playedResults.length - 1; i >= 0; i--) {
    if (playedResults[i].result === 'L') break;
    unbeatenStreak++;
    unbeatenSince = playedResults[i].date;
  }

  const total = wins + draws + losses;
  const scoredFirstWinPct = scoredFirstCount
    ? Math.round((scoredFirstWins / scoredFirstCount) * 100)
    : 0;

  const topCardedPlayers = Object.entries(cardsByPlayer)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const maxMinuteBand = Math.max(...Object.values(goalsByMinute));

  return {
    total,
    wins,
    draws,
    losses,
    winPct: total ? Math.round((wins / total) * 100) : 0,

    homeWins, homeDraws, homeLosses,
    awayWins, awayDraws, awayLosses,

    golesFor,
    golesAgainst,
    avgGolesFor: total ? (golesFor / total).toFixed(1) : '0',
    avgGolesAgainst: total ? (golesAgainst / total).toFixed(1) : '0',
    cleanSheets,
    failedToScore,

    longestWinStreak,
    unbeatenStreak,
    unbeatenSince,

    biggestWin: { score: biggestWin.score, opponent: biggestWin.opponent },
    biggestLoss: { score: biggestLoss.score, opponent: biggestLoss.opponent },
    mostGoalsMatch: { score: mostGoalsMatch.score, opponent: mostGoalsMatch.opponent },

    goalsByMinute,
    maxMinuteBand,
    golesH1,
    golesH2,

    scoredFirstCount,
    scoredFirstWins,
    scoredFirstWinPct,

    comebacks,

    yellowCards,
    redCards,
    topCardedPlayers,

    concededByMinute,
    htFt,
    byMonth,
    scorelines: Object.entries(scorelines).sort((a, b) => b[1] - a[1]).map(([score, count]) => ({ score, count })),
    multiGoalGames: Object.entries(multiGoalGames).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),

    form: playedResults.slice(-7).map((r) => r.result),
    allResults: playedResults,
  };
}
