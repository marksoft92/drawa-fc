// Linki do stron klubów w Klubiq (klubiq.pl): jeden trafny link z wpisu i ze strony klubu, tylko gdy klub ma tam stronę.
// Lista odświeżana co godzinę; gdy Klubiq nie odpowiada — po prostu brak linku.
const KLUBIQ = "https://klubiq.pl";

const plain = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/[^a-z0-9]+/g, " ").trim();
// „MKS DRAWA DRAWNO” i „Drawa Drawno” to ten sam klub; „Pogoń Szczecin” i „Pogoń Szczecinek” — nie
const sameClub = (a, b) => { const [x, y] = [plain(a), plain(b)]; return !!x && !!y && (x === y || ` ${x} `.includes(` ${y} `) || ` ${y} `.includes(` ${x} `)); };
const safeUrl = (u) => { try { const h = new URL(u); return h.protocol === "https:" && (h.hostname === "klubiq.pl" || h.hostname.endsWith(".klubiq.pl")) ? h.toString() : null; } catch { return null; } };

async function links() {
  try {
    const res = await fetch(`${KLUBIQ}/api/network/club-links?region=zachodniopomorskie`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.links) ? data.links : [];
  } catch { return []; }
}

/** Strona klubu w Klubiq dla nazwy z fanpage'a: { url, leagueName, leagueUrl } albo null. */
export async function klubiqFor(nazwa) {
  const hit = (await links()).find((l) => sameClub(l.name, nazwa));
  const url = hit && safeUrl(hit.url);
  return url ? { url, name: hit.name, league: hit.league || null, leagueUrl: hit.leagueUrl ? safeUrl(hit.leagueUrl) : null } : null;
}
