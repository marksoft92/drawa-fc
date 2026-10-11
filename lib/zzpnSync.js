import { appendFileSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { prisma } from "./prisma";
import { notifyAll } from "./pushNotify";
import { getHerb } from "./rywale";
import { parseLeagueId, loadLeague, loadMatchDetail, isDrawa, mapGame, teamKey, planMecze, buildTabela, same } from "./zzpn";

// Synchronizacja ligi Drawy z rozgrywki.zzpn.pl prosto do bazy — uruchamiana z crona
// (scripts/sync_zzpn_cron.cjs, niedziela 20:00) albo przyciskiem w panelu.
// Ligę bierze z ustawienia „ligaLink”, sezon z „aktywny_sezon”.

function getTmpDir() { return path.join(process.cwd(), "tmp"); }
function getStatusFile() { return path.join(getTmpDir(), "zzpn_sync_status.json"); }
function getDeletedFile() { return path.join(getTmpDir(), "zzpn_sync_usuniete.jsonl"); }

function ensureTmp() {
  const dir = getTmpDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function readZzpnStatus() {
  try { return JSON.parse(readFileSync(getStatusFile(), "utf8")); }
  catch { return { status: "idle" }; }
}

function writeStatus(data) {
  ensureTmp();
  writeFileSync(getStatusFile(), JSON.stringify(data, null, 2));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TABELA_POLA = ["pozycja", "nazwa", "herb", "pkt", "mecze", "wygrane", "remisy", "przegrane", "bramkiZd", "bramkiStr", "forma"];

async function syncZzpn({ dryRun }) {
  const ustawienia = await prisma.ustawienie.findMany({ where: { klucz: { in: ["ligaLink", "aktywny_sezon"] } } });
  const ust = Object.fromEntries(ustawienia.map((r) => [r.klucz, r.wartosc]));
  const sezon = ust.aktywny_sezon;
  const leagueId = parseLeagueId(ust.ligaLink) ?? parseLeagueId(process.env.ZZPN_LEAGUE_ID);
  if (!sezon) throw new Error("Brak aktywnego sezonu w ustawieniach");
  if (!leagueId) throw new Error("Brak linku do ligi na rozgrywki.zzpn.pl w ustawieniach (Panel → Kontakt → „Link do rozgrywek”)");

  const league = await loadLeague(leagueId);
  // Po zmianie sezonu link do ligi bywa jeszcze stary — nie dopisujemy wtedy meczów do złego sezonu.
  if (league.season && league.season.slice(0, 4) !== sezon.slice(0, 4)) {
    throw new Error(`Liga „${league.name}” na ZZPN to sezon ${league.season}, a aktywny sezon na stronie to ${sezon}`);
  }
  const games = league.games.filter((g) => isDrawa(g.hostName) || isDrawa(g.guestName));
  if (games.length === 0) throw new Error(`W lidze „${league.name}” nie ma meczów Drawy — sprawdź link do ligi`);

  const details = new Map();
  for (const g of games) {
    if (!mapGame(g).chceSzczegoly) continue;
    details.set(g.id, await loadMatchDetail(g.id));
    await sleep(300);
  }

  const [existing, staraTabela] = await Promise.all([
    prisma.mecz.findMany({ where: { sezon } }),
    prisma.tabelaDruzyna.findMany({ where: { sezon }, orderBy: { pozycja: "asc" } }),
  ]);

  // Herb drużyny: ten, który strona już pokazuje → logo z ZZPN → plik z public/herby.
  const znaneHerby = new Map();
  for (const r of staraTabela) if (r.herb) znaneHerby.set(teamKey(r.nazwa), r.herb);
  for (const m of existing) {
    if (m.herb1 && !znaneHerby.has(teamKey(m.team1))) znaneHerby.set(teamKey(m.team1), m.herb1);
    if (m.herb2 && !znaneHerby.has(teamKey(m.team2))) znaneHerby.set(teamKey(m.team2), m.herb2);
  }
  const herbFor = (nazwa, logoZzpn) => znaneHerby.get(teamKey(nazwa)) || logoZzpn || getHerb(teamKey(nazwa));

  const plan = planMecze({ sezon, liga: league.name, games, details, existing, herbFor });

  const tabela = league.rows ? buildTabela({ sezon, rows: league.rows, games: league.games, herbFor }) : null;
  const tabelaZmieniona = !!tabela && !same(
    tabela.map((r) => TABELA_POLA.map((k) => r[k])),
    staraTabela.map((r) => TABELA_POLA.map((k) => r[k])),
  );

  const usuwane = plan.scal.flatMap((s) => s.usun);
  const wynik = {
    liga: league.name,
    sezon,
    mecze: games.length,
    dodane: plan.dodaj.length,
    zaktualizowane: plan.aktualizuj.length,
    usunieteDuplikaty: usuwane.length,
    bezSzczegolow: plan.bezSzczegolow,
    tabela: !tabela ? "niedostępna w ZZPN" : tabelaZmieniona ? "zaktualizowana" : "bez zmian",
  };

  if (dryRun) {
    return {
      ...wynik,
      plan: {
        dodaj: plan.dodaj.map((m) => `${m.team1} – ${m.team2} (${m.date}${m.score ? `, ${m.score}` : ""})`),
        aktualizuj: plan.aktualizuj.map((a) => `${a.mecz}: ${Object.keys(a.data).join(", ")}`),
        usun: usuwane.map((m) => `${m.team1} – ${m.team2} (${m.date}${m.score ? `, ${m.score}` : ""}) [${m.id}]`),
      },
    };
  }

  if (usuwane.length) {
    ensureTmp();
    appendFileSync(getDeletedFile(), usuwane.map((m) => JSON.stringify({ usunieto: new Date().toISOString(), ...m })).join("\n") + "\n");
  }

  await prisma.$transaction(async (tx) => {
    for (const s of plan.scal) {
      const ids = s.usun.map((m) => m.id);
      await tx.komentarz.updateMany({ where: { typ: "mecz", targetId: { in: ids } }, data: { targetId: s.doId } });
      await tx.mecz.deleteMany({ where: { id: { in: ids } } });
    }
    for (const a of plan.aktualizuj) await tx.mecz.update({ where: { id: a.id }, data: a.data });
    for (const m of plan.dodaj) await tx.mecz.create({ data: m });
    if (tabelaZmieniona) {
      await tx.tabelaDruzyna.deleteMany({ where: { sezon } });
      await tx.tabelaDruzyna.createMany({ data: tabela });
    }
  }, { timeout: 60_000 });

  if (tabelaZmieniona) {
    notifyAll({
      title: "📊 Tabela ligowa zaktualizowana",
      body: "Sprawdź aktualne pozycje w tabeli",
      url: "/liga/tabela",
      tag: `tabela-${sezon}`,
    }).catch(() => {});
  }

  return wynik;
}

/** Uruchamia synchronizację (jedną naraz) i zapisuje jej stan do tmp/zzpn_sync_status.json. */
export async function runZzpnSync({ zrodlo, dryRun = false }) {
  if (globalThis.zzpnSyncRunning) return { ok: false, busy: true, error: "Synchronizacja już trwa" };
  globalThis.zzpnSyncRunning = true;
  const startedAt = new Date().toISOString();
  const poprzedni = readZzpnStatus();
  if (!dryRun) writeStatus({ ...poprzedni, status: "running", startedAt, zrodlo });
  try {
    const wynik = await syncZzpn({ dryRun });
    if (!dryRun) writeStatus({ status: "done", startedAt, finishedAt: new Date().toISOString(), zrodlo, wynik });
    return { ok: true, wynik };
  } catch (e) {
    const error = e?.message || "Nieznany błąd";
    const ostatniaUdana = poprzedni.status === "done" ? poprzedni.finishedAt : poprzedni.ostatniaUdana;
    if (!dryRun) writeStatus({ status: "error", startedAt, finishedAt: new Date().toISOString(), zrodlo, error, ostatniaUdana });
    return { ok: false, error };
  } finally {
    globalThis.zzpnSyncRunning = false;
  }
}
