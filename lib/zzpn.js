// Dane ligowe z rozgrywki.zzpn.pl: terminarz, wyniki, tabela, składy i przebieg meczów.
// Serwis udostępnia JSON pod /api-proxy/* — wystarcza zwykły fetch z serwera (bez przeglądarki
// i bez lokalnego agenta). Wynik ma ten sam kształt co scripts/scraper_zzpn.cjs.
// Plik bez zależności od bazy — planowanie zmian to czyste funkcje, zapis robi lib/zzpnSync.js.

const API = "https://rozgrywki.zzpn.pl/api-proxy";
// Backend ZZPN odsyła atrapę danych (same "-1") klientom wyglądającym na boty — stąd nagłówki przeglądarki.
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Referer: "https://rozgrywki.zzpn.pl/",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  Accept: "application/json",
};

const MONTHS_PL = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
const SKROTY = new Set(["MKS", "LKS", "GKS", "SKS", "UKS", "GLKS", "MLKS", "NKS", "OKS", "KKPN", "CRS", "ZKS", "LZS", "GKP", "III"]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Numer ligi z linku, np. https://rozgrywki.zzpn.pl/league/6/table → 6. Przyjmuje też samą liczbę. */
export function parseLeagueId(input) {
  const v = String(input ?? "").trim();
  if (/^\d{1,6}$/.test(v)) return Number(v);
  const m = v.match(/\/league\/(\d{1,6})(?:[/?#]|$)/);
  return m ? Number(m[1]) : null;
}

/** Zapytanie do ZZPN z ponowieniem przy chwilowych awariach (5xx, zerwane połączenie, { error: true }). */
async function api(path) {
  let last;
  for (const ms of [0, 1500, 4000]) {
    if (ms) await sleep(ms);
    let res;
    try {
      res = await fetch(`${API}${path}`, { headers: HEADERS, signal: AbortSignal.timeout(20_000), cache: "no-store" });
    } catch {
      last = new Error("Nie udało się połączyć z rozgrywki.zzpn.pl");
      continue;
    }
    if (res.status >= 500) { last = new Error(`Serwis rozgrywki.zzpn.pl ma awarię (${res.status})`); continue; }
    if (!res.ok) throw new Error(res.status === 404 ? "Nie znaleziono takiej ligi na rozgrywki.zzpn.pl" : `Serwis ZZPN odpowiedział błędem (${res.status})`);
    let data;
    try { data = await res.json(); } catch { last = new Error("Serwis ZZPN zwrócił nieprawidłową odpowiedź"); continue; }
    if (data && data.error === true) { last = new Error("Serwis rozgrywki.zzpn.pl ma chwilową awarię"); continue; }
    return data;
  }
  throw last;
}

/** Terminarz całej ligi + tabela. Tabela bywa chwilowo niedostępna — wtedy rows = null, a mecze i tak się importują. */
export async function loadLeague(leagueId) {
  const [fixtures, table] = await Promise.all([
    api(`/fixtures/${leagueId}`),
    api(`/table/${leagueId}`).catch(() => null),
  ]);
  const games = Array.isArray(fixtures?.games) ? fixtures.games.filter((g) => g && g.hostName && g.guestName && g.date) : [];
  const name = fixtures?.league?.name || table?.league_name || "";
  if (!name || games.length === 0) throw new Error("Serwis ZZPN nie zwrócił terminarza tej ligi — sprawdź link do ligi w ustawieniach");
  let rows = null;
  try {
    const parsed = JSON.parse(table?.table?.rows || "null");
    if (Array.isArray(parsed) && parsed.length) rows = parsed;
  } catch { /* tabela niedostępna */ }
  return { name, season: fixtures?.league?.season || "", games, rows };
}

/** Składy i przebieg meczu. null, gdy serwis ich nie ma lub nie odpowiada — synchronizacja nie może przez to upaść. */
export async function loadMatchDetail(gameId) {
  try {
    const d = await api(`/match_detail/${gameId}`);
    return d && !d.message ? d : null;
  } catch {
    return null;
  }
}

export function isDrawa(name) { return (name || "").toLowerCase().includes("drawa"); }

/** Klucz do porównywania nazw drużyn niezależnie od wielkości liter i polskich znaków. */
export function teamKey(name) {
  return (name || "").toLowerCase()
    .replace(/ą/g, "a").replace(/ć/g, "c").replace(/ę/g, "e").replace(/ł/g, "l")
    .replace(/ń/g, "n").replace(/ó/g, "o").replace(/ś/g, "s").replace(/ź/g, "z").replace(/ż/g, "z")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function pairKey(team1, team2) { return `${teamKey(team1)}|${teamKey(team2)}`; }

/** Mecze ligowe, pucharowe i sparingi tej samej pary to różne spotkania — nie wolno ich ze sobą sklejać. */
export function rodzajRozgrywek(liga) {
  const l = (liga || "").toLowerCase();
  if (l.includes("puchar")) return "puchar";
  if (l.includes("sparing") || l.includes("towarzysk")) return "sparing";
  return "liga";
}

/** ZZPN podaje część nazw wersalikami („POGOŃ II BARLINEK”, „GAVIA Choszczno”) — wyrównujemy do „Pogoń II Barlinek”. */
export function prettyTeamName(name) {
  return (name || "").trim().split(/\s+/).map((w) => {
    if (w.length < 3 || SKROTY.has(w) || w !== w.toUpperCase() || w === w.toLowerCase()) return w;
    return w.charAt(0) + w.slice(1).toLowerCase();
  }).join(" ");
}

function formatDate(dateISO, timeISO) {
  if (!dateISO) return "";
  const [, m, d] = dateISO.split("-").map(Number);
  const mon = MONTHS_PL[(m || 1) - 1] || "";
  const [hh, mm] = (timeISO || "00:00:00").split(":").map(Number);
  if (!hh && !mm) return `${d} ${mon}`;
  return `${d} ${mon} ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function cardLabel(cards) {
  if (!cards || cards.length === 0) return null;
  const types = cards.map((c) => c.type);
  const yellows = types.filter((t) => t === "Yellow").length;
  if (types.includes("SecondYellow") || yellows >= 2) return "żółto-czerwona";
  if (types.includes("Red")) return "czerwona";
  if (yellows > 0) return "żółta";
  return null;
}

function subLabel(subs) {
  if (!subs || subs.length === 0) return null;
  const hasIn = subs.some((s) => s.type === "In");
  const hasOut = subs.some((s) => s.type === "Out");
  if (hasIn && hasOut) return "wszedł_i_zszedł";
  if (hasIn) return "wszedł";
  if (hasOut) return "zszedł";
  return null;
}

function parseTeamSquad(squad) {
  if (!Array.isArray(squad) || squad.length === 0) return null;
  const pierwsza11 = [], rezerwa = [];
  for (const p of squad) {
    const goals = Array.isArray(p.goals) ? p.goals : [];
    const zawodnik = {
      id: p.id,
      nazwisko: `${p.firstname || ""} ${p.lastname || ""}`.trim(),
      numer: p.number > 0 ? p.number : null,
      gole_w_meczu: goals.filter((g) => !/own/i.test(g.type || "")).length,
      samobojcze_w_meczu: goals.filter((g) => /own/i.test(g.type || "")).length,
      kartka_w_meczu: cardLabel(p.cards),
      zmiana_w_meczu: subLabel(p.substitutions),
    };
    if (p.type === "Starter") pierwsza11.push(zawodnik); else rezerwa.push(zawodnik);
  }
  return { pierwsza11, rezerwa, ustawienie: null };
}

function typFromEvent(ev) {
  if (ev.type === "Goal") return /own/i.test(ev.subType || "") ? "samobójczy" : "gol";
  if (ev.type === "Card") {
    if (ev.subType === "Yellow") return "żółta kartka";
    if (ev.subType === "Red") return "czerwona kartka";
    if (ev.subType === "SecondYellow") return "żółto-czerwona";
    return "kartka";
  }
  if (ev.type === "Substitution") return "zmiana";
  return "nieznany";
}

function buildZdarzenia(eventsGrouped) {
  const flat = [];
  for (const period of (eventsGrouped || [])) {
    for (const ev of (period.events || [])) flat.push(ev);
  }
  // ZZPN podaje zdarzenia od najnowszego — odwracamy, żeby zdarzenia z tej samej minuty
  // (np. gol w 90' i w 90'+3') zostały w kolejności, w jakiej padły; sort jest stabilny.
  flat.reverse();
  flat.sort((a, b) => ((a.time ?? 0) - (b.time ?? 0)) || ((a.additionalTime ?? 0) - (b.additionalTime ?? 0)));

  let hostGoals = 0, guestGoals = 0;
  return flat.map((ev) => {
    const typ = typFromEvent(ev);
    if (typ === "gol" || typ === "samobójczy") {
      const scoringHost = typ === "samobójczy" ? !ev.isHost : ev.isHost;
      if (scoringHost) hostGoals++; else guestGoals++;
    }
    const imie = ev.player ? `${ev.player.firstname || ""} ${ev.player.lastname || ""}`.trim() : null;
    const minuta = ev.time != null
      ? (ev.additionalTime ? `${ev.time}+${ev.additionalTime}` : String(ev.time))
      : (ev.minute ? ev.minute.replace(/'/g, "").trim() : null);
    return {
      minuta,
      zawodnik: imie || null,
      typ,
      strona: ev.isHost ? "gospodarze" : "goscie",
      wynik_po: `${hostGoals}:${guestGoals}`,
    };
  });
}

/** Szczegóły meczu z ZZPN → pola rekordu Mecz. null, gdy protokół jest pusty. */
export function mapDetail(detail) {
  if (!detail) return null;
  const wszystkieZdarzenia = buildZdarzenia(detail.events);
  const gospodarze = parseTeamSquad(detail.hsquad);
  const goscie = parseTeamSquad(detail.asquad);
  if (wszystkieZdarzenia.length === 0 && !gospodarze && !goscie) return null;
  return {
    wszystkieZdarzenia,
    strzelcy: wszystkieZdarzenia.filter((z) => z.typ === "gol" || z.typ === "samobójczy"),
    kartki: wszystkieZdarzenia.filter((z) => z.typ.includes("kartka") || z.typ.includes("żółto")),
    zmiany: wszystkieZdarzenia.filter((z) => z.typ === "zmiana"),
    sklady: gospodarze || goscie ? { gospodarze, goscie } : {},
  };
}

const validScore = (s) => typeof s === "string" && /^\d+:\d+$/.test(s);

export function mapGame(g) {
  const rozegrany = g.state === "Rozegrany" || g.state === "Walkover";
  const scoreOk = validScore(g.scoresFinal);
  const walkower = g.state === "Walkover" || (rozegrany && !!g.scoresFinal && !scoreOk);
  return {
    team1: prettyTeamName(g.hostName),
    team2: prettyTeamName(g.guestName),
    rozegrany,
    walkower,
    score: rozegrany && scoreOk ? g.scoresFinal : null,
    komentarz: walkower && g.scoresFinal && !scoreOk ? g.scoresFinal : null,
    date: formatDate(g.date, g.time),
    status: rozegrany ? (walkower ? "walkower" : "koniec") : "planowany",
    chceSzczegoly: rozegrany && !walkower,
  };
}

// Postgres (jsonb) zwraca klucze obiektów w innej kolejności niż je zapisano, więc zwykłe
// porównanie JSON.stringify zgłaszałoby zmianę przy każdej synchronizacji.
function canon(v) {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])]));
  return v ?? null;
}
export function same(a, b) { return JSON.stringify(canon(a)) === JSON.stringify(canon(b)); }

const SZCZEGOLY = ["wszystkieZdarzenia", "strzelcy", "kartki", "zmiany", "sklady"];
const maZdarzenia = (m) => Array.isArray(m?.wszystkieZdarzenia) && m.wszystkieZdarzenia.length > 0;

/**
 * Porównuje mecze Drawy z ZZPN z rekordami sezonu w bazie i zwraca listę zmian.
 * Mecz jest rozpoznawany po parze drużyn (gospodarz–gość gra w lidze raz na sezon), a nie po dacie
 * ani dokładnej pisowni — dzięki temu zmiana terminu czy „INA STRADZEWO” vs „Ina Stradzewo” nie tworzy
 * duplikatu, a duplikaty już istniejące są scalane do najstarszego rekordu (zachowuje adres strony meczu).
 */
export function planMecze({ sezon, liga, games, details, existing, herbFor }) {
  const byPair = new Map();
  for (const m of existing) {
    if (rodzajRozgrywek(m.liga) !== "liga") continue;
    const k = pairKey(m.team1, m.team2);
    if (!byPair.has(k)) byPair.set(k, []);
    byPair.get(k).push(m);
  }

  const plan = { dodaj: [], aktualizuj: [], scal: [], bezSzczegolow: [] };

  for (const g of games) {
    const z = mapGame(g);
    const kandydaci = (byPair.get(pairKey(z.team1, z.team2)) || [])
      .slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const keep = kandydaci[0] || null;
    const duplikaty = kandydaci.slice(1);

    const data = {
      liga,
      team1: z.team1,
      team2: z.team2,
      herb1: keep?.herb1 || herbFor(z.team1, g.hostLogo),
      herb2: keep?.herb2 || herbFor(z.team2, g.guestLogo),
    };

    // Wynik wpisany ręcznie (np. relacja na żywo), którego ZZPN jeszcze nie ma, nie może zniknąć.
    const recznyWynik = !z.rozegrany && kandydaci.some((m) => m.score || m.walkower || m.status === "live");
    if (!recznyWynik) {
      data.score = z.score;
      data.status = z.status;
      data.walkower = z.walkower;
      data.date = z.date;
      if (z.komentarz) data.komentarz = z.komentarz;
    } else if (keep && !keep.score && !keep.walkower && keep.status !== "live") {
      const zWynikiem = duplikaty.find((m) => m.score || m.walkower || m.status === "live");
      Object.assign(data, { score: zWynikiem.score, status: zWynikiem.status, walkower: zWynikiem.walkower, date: zWynikiem.date });
    }

    // Protokół z ZZPN zastępuje składy i przebieg; gdy go (jeszcze) nie ma, zostaje to, co już jest w bazie.
    const d = z.chceSzczegoly ? mapDetail(details.get(g.id)) : null;
    if (d) Object.assign(data, d);
    else {
      const bogaty = kandydaci.find(maZdarzenia);
      if (bogaty && bogaty !== keep) for (const k of SZCZEGOLY) data[k] = bogaty[k];
      if (z.chceSzczegoly && !bogaty) plan.bezSzczegolow.push(`${z.team1} – ${z.team2}`);
    }

    if (!keep) {
      plan.dodaj.push({ sezon, ...data });
      continue;
    }
    if (duplikaty.length) plan.scal.push({ doId: keep.id, usun: duplikaty });

    const zmiany = Object.fromEntries(Object.entries(data).filter(([k, v]) => !same(keep[k], v)));
    if (zmiany.date !== undefined && !data.score) zmiany.notified1h = false;
    if (Object.keys(zmiany).length) plan.aktualizuj.push({ id: keep.id, mecz: `${z.team1} – ${z.team2}`, data: zmiany });
  }
  return plan;
}

/** Forma drużyny: do 5 ostatnich wyników, od najnowszego (W = wygrana, R = remis, P = porażka). */
function forma(teamId, games) {
  return games
    .filter((g) => (g.hostId === teamId || g.guestId === teamId) && (g.state === "Rozegrany" || g.state === "Walkover") && validScore(g.scoresFinal))
    .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
    .slice(0, 5)
    .map((g) => {
      const [h, a] = g.scoresFinal.split(":").map(Number);
      if (h === a) return "R";
      return (h > a) === (g.hostId === teamId) ? "W" : "P";
    })
    .join("");
}

/** Wiersze tabeli ZZPN → pola TabelaDruzyna. */
export function buildTabela({ sezon, rows, games, herbFor }) {
  return rows.filter((r) => r?.team?.name).map((r, i) => {
    const nazwa = prettyTeamName(r.team.name);
    return {
      sezon,
      pozycja: Number(r.index) || i + 1,
      nazwa,
      herb: herbFor(nazwa, r.team.logo),
      pkt: r.stats?.points ?? 0,
      mecze: r.stats?.matchesCount ?? 0,
      wygrane: r.stats?.winsCount ?? 0,
      remisy: r.stats?.drawsCount ?? 0,
      przegrane: r.stats?.losesCount ?? 0,
      bramkiZd: r.stats?.goalsCount ?? 0,
      bramkiStr: r.stats?.lostGoalsCount ?? 0,
      forma: forma(r.team.id, games) || null,
    };
  });
}

/** „Bieńkowski Dawid” i „Dawid Bieńkowski” → ten sam klucz (bez polskich znaków i kolejności słów). */
export function nameKey(name) {
  return teamKey(name).split("-").filter(Boolean).sort().join(" ");
}

// Literówka w protokole albo w kadrze („Eliasz” / „Eljasz”) — najwyżej jedna zmieniona, dodana lub brakująca litera.
function prawieTakieSame(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const reszta = (x, y) => a.slice(i + x) === b.slice(i + y);
  return reszta(1, 1) || reszta(1, 0) || reszta(0, 1);
}

/**
 * Statystyki zawodników Drawy z protokołów meczów ligowych (składy z ZZPN): występy, gole, kartki.
 * Zawodnik z protokołu jest łączony z kadrą po imieniu i nazwisku. Asyst i meczów pucharowych
 * w protokołach ligi nie ma — te pola zostają wpisywane ręcznie.
 */
export function policzStatystykiZawodnikow(mecze, players) {
  const zProtokolow = new Map();
  for (const m of mecze) {
    if (rodzajRozgrywek(m.liga) !== "liga" || !m.score) continue;
    const sklad = m.sklady?.[isDrawa(m.team1) ? "gospodarze" : "goscie"];
    if (!sklad) continue;
    const wpisy = [
      ...(sklad.pierwsza11 || []).map((p) => ({ p, gral: true })),
      ...(sklad.rezerwa || []).map((p) => ({ p, gral: (p.zmiana_w_meczu || "").startsWith("wszedł") })),
    ];
    for (const { p, gral } of wpisy) {
      const key = nameKey(p.nazwisko);
      if (!key) continue;
      if (!zProtokolow.has(key)) zProtokolow.set(key, { nazwisko: p.nazwisko, mecze: 0, gole: 0, zolte: 0, czerwone: 0 });
      const s = zProtokolow.get(key);
      const kartka = p.kartka_w_meczu || "";
      if (gral) s.mecze++;
      s.gole += p.gole_w_meczu || 0;
      if (kartka === "żółto-czerwona") s.zolte += 2; else if (kartka.includes("żółta")) s.zolte += 1;
      if (kartka.includes("czerwona")) s.czerwone += 1;
    }
  }

  const poKluczu = new Map(players.map((pl) => [nameKey(pl.imieNazwisko), pl]));
  const stats = [], niedopasowani = [];
  const zajeci = new Set();
  const reszta = [];
  for (const [key, s] of zProtokolow) {
    const pl = poKluczu.get(key);
    if (pl) { zajeci.add(pl.id); stats.push({ playerId: pl.id, zawodnik: pl.imieNazwisko, mecze: s.mecze, gole: s.gole, zolte: s.zolte, czerwone: s.czerwone }); }
    else reszta.push([key, s]);
  }
  for (const [key, s] of reszta) {
    const podobni = players.filter((pl) => !zajeci.has(pl.id) && prawieTakieSame(nameKey(pl.imieNazwisko), key));
    if (podobni.length === 1) {
      zajeci.add(podobni[0].id);
      stats.push({ playerId: podobni[0].id, zawodnik: podobni[0].imieNazwisko, mecze: s.mecze, gole: s.gole, zolte: s.zolte, czerwone: s.czerwone });
    } else if (s.mecze > 0) niedopasowani.push(s.nazwisko);
  }
  return { stats, niedopasowani };
}
