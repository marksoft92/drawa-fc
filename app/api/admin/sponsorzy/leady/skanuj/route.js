import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Powiaty w promieniu rozsądnego dojazdu od Drawna — pod dane z OpenStreetMap
// (nazwa musi się zgadzać z tagiem "name" granicy administracyjnej w OSM).
const POWIATY = [
  "powiat choszczeński",
  "powiat myśliborski",
  "powiat pyrzycki",
  "powiat stargardzki",
  "powiat drawski",
  "powiat wałecki",
  "powiat strzelecko-drezdenecki",
];

// Tylko punkty, które realnie mogą być lokalnym sponsorem — pomijamy np. ławki,
// przystanki czy kosze, które też trafiają do OSM jako POI.
const AMENITY_WHITELIST = [
  "restaurant", "cafe", "bar", "pub", "fast_food", "fuel", "bank", "pharmacy",
  "car_rental", "car_wash", "veterinary", "dentist", "clinic", "driving_school", "cinema",
];

function overpassQuery(powiat) {
  const amenityRegex = AMENITY_WHITELIST.join("|");
  return `[out:json][timeout:25];
area["name"="${powiat}"]["boundary"="administrative"]->.a;
(
  node["shop"]["name"](area.a);
  node["office"]["name"](area.a);
  node["craft"]["name"](area.a);
  node["amenity"~"^(${amenityRegex})$"]["name"](area.a);
);
out tags 300;`;
}

function kategoria(tags) {
  if (tags.shop) return `sklep (${tags.shop})`;
  if (tags.office) return `biuro (${tags.office})`;
  if (tags.craft) return `rzemiosło (${tags.craft})`;
  if (tags.amenity) return tags.amenity;
  return "inne";
}

function adres(tags) {
  const parts = [];
  if (tags["addr:street"]) parts.push(`${tags["addr:street"]}${tags["addr:housenumber"] ? " " + tags["addr:housenumber"] : ""}`);
  else if (tags["addr:housenumber"]) parts.push(tags["addr:housenumber"]);
  if (tags["addr:city"]) parts.push(tags["addr:city"]);
  return parts.join(", ") || null;
}

export async function GET() {
  if (!(await hasAccess("sponsorzy"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  return Response.json(POWIATY);
}

export async function POST(request) {
  if (!(await hasAccess("sponsorzy"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { powiat } = await request.json();
  if (!POWIATY.includes(powiat)) return Response.json({ error: "Nieznany powiat" }, { status: 400 });

  let data;
  try {
    const r = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(overpassQuery(powiat)),
      signal: AbortSignal.timeout(40000),
    });
    if (!r.ok) return Response.json({ error: `OpenStreetMap (Overpass) odpowiedziało błędem HTTP ${r.status}` }, { status: 502 });
    data = await r.json();
  } catch (e) {
    return Response.json({ error: "Nie udało się połączyć z OpenStreetMap (Overpass): " + e.message }, { status: 502 });
  }

  const [existingLeady, existingSponsorzy] = await Promise.all([
    prisma.sponsorLead.findMany({ select: { nazwa: true } }),
    prisma.sponsor.findMany({ select: { nazwa: true } }),
  ]);
  const known = new Set([
    ...existingLeady.map(l => l.nazwa.toLowerCase().trim()),
    ...existingSponsorzy.map(s => s.nazwa.toLowerCase().trim()),
  ]);

  const seen = new Set();
  const results = [];
  for (const el of data.elements || []) {
    const tags = el.tags || {};
    const nazwa = tags.name?.trim();
    if (!nazwa) continue;
    const key = nazwa.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    results.push({
      nazwa,
      telefon: tags.phone || tags["contact:phone"] || null,
      www: tags.website || tags["contact:website"] || null,
      adres: adres(tags),
      kategoria: kategoria(tags),
      status: known.has(key) ? "exists" : "pending",
    });
  }

  results.sort((a, b) => a.nazwa.localeCompare(b.nazwa, "pl"));

  return Response.json({ powiat, results });
}
