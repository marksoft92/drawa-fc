import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const UMAMI_URL = process.env.UMAMI_API_URL || "http://127.0.0.1:3001";
const UMAMI_WEBSITE_ID = process.env.UMAMI_WEBSITE_ID;
const UMAMI_USERNAME = process.env.UMAMI_USERNAME || "admin";
const UMAMI_PASSWORD = process.env.UMAMI_PASSWORD || "umami";

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch(`${UMAMI_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: UMAMI_USERNAME, password: UMAMI_PASSWORD }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  cachedToken = data.token;
  tokenExpiry = Date.now() + 30 * 60 * 1000;
  return cachedToken;
}

async function umamiFetch(path, params = {}) {
  const token = await getToken();
  if (!token) return null;
  const url = new URL(`${UMAMI_URL}/api/websites/${UMAMI_WEBSITE_ID}/${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, v);
  }
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  return res.json();
}

export async function GET(request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Brak dostępu" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "stats";
  const startAt = searchParams.get("startAt");
  const endAt = searchParams.get("endAt");
  const unit = searchParams.get("unit") || "day";
  const tz = searchParams.get("timezone") || "Europe/Warsaw";

  const base = { startAt, endAt, timezone: tz };

  switch (type) {
    case "stats": {
      const data = await umamiFetch("stats", base);
      return Response.json(data || {});
    }
    case "pageviews": {
      const data = await umamiFetch("pageviews", { ...base, unit });
      return Response.json(data || { pageviews: [], sessions: [] });
    }
    case "metrics": {
      const metricType = searchParams.get("metric") || "path";
      const limit = searchParams.get("limit") || "10";
      const data = await umamiFetch("metrics", { ...base, type: metricType, limit });
      return Response.json(data || []);
    }
    case "sessions": {
      const data = await umamiFetch("sessions", base);
      return Response.json(data || { data: [] });
    }
    case "active": {
      const token = await getToken();
      if (!token) return Response.json({ x: 0 });
      const res = await fetch(`${UMAMI_URL}/api/websites/${UMAMI_WEBSITE_ID}/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return Response.json({ x: 0 });
      return Response.json(await res.json());
    }
    default:
      return Response.json({ error: "Nieznany typ" }, { status: 400 });
  }
}
