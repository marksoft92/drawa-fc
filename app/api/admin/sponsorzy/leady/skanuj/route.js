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

// Publiczny Overpass bywa przeciążony ("server too busy") — próbujemy po
// kolei kilku instancji zamiast polegać na jednej.
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
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

async function queryOverpass(powiat) {
  const body = "data=" + encodeURIComponent(overpassQuery(powiat));
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    // Apache przed Overpass odrzuca requesty bez Accept (406) — fetch() w
    // Node domyślnie go nie wysyła (w przeciwieństwie do curl/przeglądarki).
    // User-Agent zgodnie z polityką użytkowania Overpass API.
    "Accept": "*/*",
    "User-Agent": "drawa-fc-sponsor-crm/1.0 (https://mksdrawadrawno.pl; kontakt: kontakt@mksdrawadrawno.pl)",
  };

  const errors = [];
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const r = await fetch(endpoint, { method: "POST", headers, body, signal: AbortSignal.timeout(15000) });
      if (!r.ok) {
        const text = await r.text().catch(() => "");
        errors.push(`${endpoint}: HTTP ${r.status} ${text.slice(0, 200)}`);
        continue;
      }
      return await r.json();
    } catch (e) {
      errors.push(`${endpoint}: ${e.message}`);
    }
  }
  console.error(`[sponsorzy/leady/skanuj] wszystkie instancje Overpass zawiodły:\n${errors.join("\n")}`);
  throw new Error("Wszystkie serwery OpenStreetMap (Overpass) są chwilowo przeciążone — spróbuj ponownie za kilka minut.");
}

export async function GET() {
  if (!(await hasAccess("sponsorzy"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  return Response.json(POWIATY);
}

export async function POST(request) {
  if (!(await hasAccess("sponsorzy"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  let powiat;
  try {
    ({ powiat } = await request.json());
  } catch {
    return Response.json({ error: "Niepoprawne dane żądania" }, { status: 400 });
  }
  if (!POWIATY.includes(powiat)) return Response.json({ error: "Nieznany powiat" }, { status: 400 });

  // Cała reszta w jednym try/catch — endpoint musi zawsze zwrócić JSON, nawet
  // gdy padnie Overpass, baza albo coś nieoczekiwanego. Błąd trafia do logów
  // PM2, żeby dało się go zdiagnozować bez zgadywania.
  try {
    const data = await queryOverpass(powiat);

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
  } catch (e) {
    console.error(`[sponsorzy/leady/skanuj] błąd dla powiatu "${powiat}":`, e);
    return Response.json({ error: "Nie udało się zeskanować regionu: " + e.message }, { status: 502 });
  }
}
