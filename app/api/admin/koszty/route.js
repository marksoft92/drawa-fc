import { hasAccess } from "@/lib/auth";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

const SESSION_GAP_MS = 2 * 60 * 60 * 1000;
const BUFFER_MS = 15 * 60 * 1000;
const HOURLY_RATE = 100;
const SERVER_MONTHLY = 50;
const SERVER_START = new Date("2026-06-01");

export async function GET() {
  if (!(await hasAccess("koszty"))) {
    return Response.json({ error: "Brak dostępu" }, { status: 403 });
  }

  let commits = [];
  try {
    const raw = execSync('git log --all --format="%aI|||%s"', { timeout: 10000 }).toString().trim();
    commits = raw.split("\n").filter(Boolean).map((line) => {
      const [date, ...msgParts] = line.split("|||");
      return { date: new Date(date), message: msgParts.join("|||") };
    });
  } catch {
    return Response.json({ error: "Nie można odczytać historii git" }, { status: 500 });
  }

  commits.sort((a, b) => a.date - b.date);

  const sessions = [];
  let current = null;
  for (const c of commits) {
    if (!current || c.date - current.end > SESSION_GAP_MS) {
      if (current) sessions.push(current);
      current = { start: c.date, end: c.date, commits: [c] };
    } else {
      current.end = c.date;
      current.commits.push(c);
    }
  }
  if (current) sessions.push(current);

  const sessionDetails = sessions.map((s) => {
    const durationMs = s.end - s.start + BUFFER_MS * 2;
    const hours = Math.max(durationMs / (1000 * 60 * 60), 0.5);
    return {
      date: s.start.toISOString().slice(0, 10),
      start: s.start.toISOString(),
      end: s.end.toISOString(),
      hours: Math.round(hours * 100) / 100,
      commitCount: s.commits.length,
      commits: s.commits.map((c) => ({ date: c.date.toISOString(), message: c.message })),
    };
  });

  const totalDevHours = sessionDetails.reduce((sum, s) => sum + s.hours, 0);
  const totalDevCost = Math.round(totalDevHours * HOURLY_RATE);

  const now = new Date();
  let serverMonths = 0;
  if (now >= SERVER_START) {
    const diffMs = now - SERVER_START;
    serverMonths = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30));
  }
  const totalServerCost = serverMonths * SERVER_MONTHLY;

  const dayMap = {};
  for (const s of sessionDetails) {
    if (!dayMap[s.date]) dayMap[s.date] = { hours: 0, commits: 0 };
    dayMap[s.date].hours += s.hours;
    dayMap[s.date].commits += s.commitCount;
  }
  const dailyBreakdown = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({ date, hours: Math.round(d.hours * 100) / 100, commits: d.commits, cost: Math.round(d.hours * HOURLY_RATE) }));

  return Response.json({
    totalCommits: commits.length,
    totalDevHours: Math.round(totalDevHours * 100) / 100,
    totalDevCost,
    hourlyRate: HOURLY_RATE,
    serverMonthly: SERVER_MONTHLY,
    serverMonths,
    totalServerCost,
    totalCost: totalDevCost + totalServerCost,
    firstCommit: commits[0]?.date.toISOString() ?? null,
    lastCommit: commits[commits.length - 1]?.date.toISOString() ?? null,
    sessions: sessionDetails,
    dailyBreakdown,
  });
}
