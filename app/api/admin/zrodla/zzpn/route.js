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

const GOOGLEBOT_UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

function stripDiacritics(s) {
  return s.replace(/ą/g,"a").replace(/ć/g,"c").replace(/ę/g,"e").replace(/ł/g,"l")
    .replace(/ń/g,"n").replace(/ó/g,"o").replace(/ś/g,"s").replace(/ź/g,"z").replace(/ż/g,"z")
    .replace(/Ą/g,"A").replace(/Ć/g,"C").replace(/Ę/g,"E").replace(/Ł/g,"L")
    .replace(/Ń/g,"N").replace(/Ó/g,"O").replace(/Ś/g,"S").replace(/Ź/g,"Z").replace(/Ż/g,"Z");
}

function generateFbSlugs(name) {
  const clean = stripDiacritics(name).replace(/[^a-zA-Z0-9 ]/g, "").trim();
  const words = clean.split(/\s+/);
  const joined = words.join("");
  const dotted = words.join(".");
  const dashed = words.join("-");
  const slugs = new Set([joined, dotted, dashed]);

  const prefixes = ["KS", "LKS", "MKS", "GKS", "SKS", "UKS", "GLKS", "MLKS", "NKS", "KP", "AP", "OKS", "KKPN", "CRS", "MG"];
  for (const p of prefixes) {
    if (words[0]?.toUpperCase() === p && words.length > 1) {
      const rest = words.slice(1);
      slugs.add(rest.join(""));
      slugs.add(rest.join("."));
      slugs.add(rest.join("-"));
    }
    if (words[0]?.toUpperCase() !== p) {
      slugs.add(p + joined);
      slugs.add(p + "." + dotted);
    }
  }

  if (words.length >= 2) {
    slugs.add(words[0]);
    slugs.add(words[words.length - 1] + words[0]);
    slugs.add(words[0] + words[words.length - 1]);
    slugs.add(words[0] + "." + words[words.length - 1]);
  }

  return [...slugs].filter(s => s.length >= 3);
}

async function checkFbPage(slug) {
  try {
    const r = await fetch(`https://www.facebook.com/${slug}`, {
      headers: { "User-Agent": GOOGLEBOT_UA },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    const html = await r.text();
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch && titleMatch[1] !== "Facebook" && titleMatch[1] !== "Log in to Facebook") {
      return { url: `https://www.facebook.com/${slug}`, title: titleMatch[1].trim() };
    }
  } catch {}
  return null;
}

async function searchFacebookPage(teamName) {
  const slugs = generateFbSlugs(teamName);
  for (const slug of slugs.slice(0, 12)) {
    const result = await checkFbPage(slug);
    if (result) return result.url;
  }
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
      if (!r.team?.name) continue;
      if (existingNames.has(r.team.name.toLowerCase())) {
        results.push({ name: r.team.name, logo: r.team.logo, status: "exists", fbUrl: null });
        continue;
      }
      const fbUrl = await searchFacebookPage(r.team.name);
      results.push({
        name: r.team.name,
        logo: r.team.logo || null,
        status: fbUrl ? "found" : "not-found",
        fbUrl,
      });
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
