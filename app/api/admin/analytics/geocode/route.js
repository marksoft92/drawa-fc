import { isAdmin } from "@/lib/auth";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

const CACHE_FILE = join(process.cwd(), "data", "geocode-cache.json");

function loadCache() {
  try {
    if (existsSync(CACHE_FILE)) return JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
  } catch {}
  return {};
}

function saveCache(cache) {
  try {
    const dir = join(process.cwd(), "data");
    if (!existsSync(dir)) {
      const { mkdirSync } = require("fs");
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch {}
}

async function geocodeCity(city, country) {
  const query = country ? `${city}, ${country}` : city;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&accept-language=pl`;
  const res = await fetch(url, {
    headers: { "User-Agent": "MKS-Drawa-Analytics/1.0 (mksdrawadrawno.pl)" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.length === 0) return null;
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

export async function POST(request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Brak dostępu" }, { status: 403 });
  }

  const { cities } = await request.json();
  if (!Array.isArray(cities)) return Response.json({});

  const cache = loadCache();
  const result = {};
  const toFetch = [];

  for (const { name, country } of cities) {
    const key = `${name}|${country || ""}`;
    if (cache[key]) {
      result[name] = cache[key];
    } else {
      toFetch.push({ name, country, key });
    }
  }

  for (const { name, country, key } of toFetch) {
    const coords = await geocodeCity(name, country);
    if (coords) {
      cache[key] = coords;
      result[name] = coords;
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  if (toFetch.length > 0) saveCache(cache);

  return Response.json(result);
}
