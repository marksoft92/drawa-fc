import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const ZZPN_API = "https://rozgrywki.zzpn.pl/api-proxy";
const ZZPN_HEADERS = {
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Referer": "https://rozgrywki.zzpn.pl/",
};

const GOOGLE_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchZZPN(path) {
  const r = await fetch(`${ZZPN_API}${path}`, { headers: ZZPN_HEADERS });
  if (!r.ok) throw new Error(`ZZPN ${path}: ${r.status}`);
  return r.json();
}

async function searchFacebookPage(teamName) {
  const query = encodeURIComponent(`site:facebook.com "${teamName}" piłka nożna`);
  try {
    const r = await fetch(`https://www.google.com/search?q=${query}&num=3&hl=pl`, {
      headers: { "User-Agent": GOOGLE_UA, "Accept-Language": "pl-PL,pl;q=0.9" },
      signal: AbortSignal.timeout(8000),
    });
    const html = await r.text();
    const fbMatch = html.match(/https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9._%-]+/);
    if (fbMatch) {
      let url = fbMatch[0].replace(/&amp;/g, "&").replace(/[?#].*$/, "");
      if (/facebook\.com\/(search|share|sharer|dialog|login|help|policies)/.test(url)) return null;
      return url;
    }
  } catch {}
  return null;
}

export async function GET(request) {
  if (!(await hasAccess("zrodla"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const url = new URL(request.url);
  const leagueId = url.searchParams.get("leagueId");

  if (!leagueId) {
    const leagues = await fetchZZPN("/leagues-all");
    const senior = leagues
      .filter(l => l.category_id === 1 && !l.name.toLowerCase().includes("puchar") && !l.name.toLowerCase().includes("bara"))
      .sort((a, b) => a.pozycja - b.pozycja);
    return Response.json(senior);
  }

  const data = await fetchZZPN(`/table/${leagueId}`);
  const rows = JSON.parse(data.table?.rows || "[]");

  const existing = await prisma.zrodloFB.findMany({ select: { nazwa: true, fbUrl: true } });
  const existingNames = new Set(existing.map(z => z.nazwa.toLowerCase()));
  const existingUrls = new Set(existing.map(z => z.fbUrl.toLowerCase()));

  const teams = rows.map(r => ({
    zzpnId: r.team?.id,
    name: r.team?.name,
    logo: r.team?.logo || null,
    position: r.index,
    points: r.stats?.points,
    exists: existingNames.has(r.team?.name?.toLowerCase()),
  })).filter(t => t.name);

  return Response.json({ leagueName: data.league_name, teams });
}

export async function POST(request) {
  if (!(await hasAccess("zrodla"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { action, teamName, leagueId } = await request.json();

  if (action === "search-fb") {
    const fbUrl = await searchFacebookPage(teamName);
    return Response.json({ fbUrl });
  }

  if (action === "scan-league") {
    const data = await fetchZZPN(`/table/${leagueId}`);
    const rows = JSON.parse(data.table?.rows || "[]");

    const existing = await prisma.zrodloFB.findMany({ select: { nazwa: true, fbUrl: true } });
    const existingNames = new Set(existing.map(z => z.nazwa.toLowerCase()));

    const results = [];
    for (const r of rows) {
      if (!r.team?.name || existingNames.has(r.team.name.toLowerCase())) {
        results.push({ name: r.team?.name, status: "exists", fbUrl: null, logo: r.team?.logo });
        continue;
      }
      const fbUrl = await searchFacebookPage(r.team.name);
      results.push({ name: r.team.name, fbUrl, logo: r.team?.logo, status: fbUrl ? "found" : "not-found" });
      await new Promise(r => setTimeout(r, 1500));
    }

    return Response.json({ leagueName: data.league_name, results });
  }

  if (action === "add") {
    const { nazwa, fbUrl, herb } = await request.json();
    const zrodlo = await prisma.zrodloFB.create({
      data: { nazwa: nazwa.trim(), fbUrl: fbUrl.trim(), herb: herb?.trim() || null },
    });
    return Response.json(zrodlo, { status: 201 });
  }

  return Response.json({ error: "Nieznana akcja" }, { status: 400 });
}
