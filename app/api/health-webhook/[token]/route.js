import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TZ = "Europe/Warsaw";

// Kalendarzowy dzień (wg czasu polskiego) danej próbki, zwrócony jako północ UTC tego dnia —
// próbki z jednego payloadu z apki mogą należeć do różnych dni (dosync zaległych rekordów
// z poprzednich dni), więc nie wolno bucketować całego payloadu jedną datą.
function dayBucket(isoString) {
  const d = new Date(isoString);
  const local = new Date(d.toLocaleString("en-US", { timeZone: TZ }));
  return new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate()));
}

function groupByDay(samples, timeField) {
  const groups = new Map();
  for (const s of samples) {
    const t = s[timeField];
    if (!t) continue;
    const key = dayBucket(t).toISOString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  return groups;
}

export async function POST(request, { params }) {
  const { token } = await params;

  const player = await prisma.player.findUnique({ where: { healthToken: token } });
  if (!player) return Response.json({ error: "Nieznany token" }, { status: 404 });

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Nieprawidłowy JSON" }, { status: 400 });
  }

  const steps = payload.steps ?? [];
  const activeCalories = payload.active_calories ?? [];
  const heartRate = (payload.heart_rate ?? []).filter((s) => s.time && s.bpm != null);

  const stepsByDay = groupByDay(steps, "start_time");
  const caloriesByDay = groupByDay(activeCalories, "start_time");
  const hrByDay = groupByDay(heartRate, "time");

  const dayKeys = new Set([...stepsByDay.keys(), ...caloriesByDay.keys(), ...hrByDay.keys()]);

  for (const dayKey of dayKeys) {
    const date = new Date(dayKey);
    const daySteps = stepsByDay.get(dayKey) ?? [];
    const dayCalories = caloriesByDay.get(dayKey) ?? [];
    const dayHr = (hrByDay.get(dayKey) ?? []).sort((a, b) => new Date(a.time) - new Date(b.time));

    const stepsCount = daySteps.reduce((max, s) => Math.max(max, s.count ?? 0), 0);
    const caloriesTotal = dayCalories.reduce((max, c) => Math.max(max, c.calories ?? 0), 0);

    const existing = await prisma.playerHealthDaily.findUnique({
      where: { playerId_date: { playerId: player.id, date } },
    });

    let heartRateAvg = existing?.heartRateAvg ?? null;
    let heartRateMax = existing?.heartRateMax ?? null;
    let heartRateSamples = existing?.heartRateSamples ?? 0;
    let lastHrTime = existing?.lastHrTime ?? null;

    for (const sample of dayHr) {
      if (lastHrTime && new Date(sample.time).getTime() === new Date(lastHrTime).getTime()) continue;

      heartRateAvg = heartRateAvg == null
        ? sample.bpm
        : (heartRateAvg * heartRateSamples + sample.bpm) / (heartRateSamples + 1);
      heartRateSamples += 1;
      heartRateMax = heartRateMax == null ? sample.bpm : Math.max(heartRateMax, sample.bpm);
      lastHrTime = sample.time;
    }

    await prisma.playerHealthDaily.upsert({
      where: { playerId_date: { playerId: player.id, date } },
      create: {
        playerId: player.id,
        date,
        steps: stepsCount,
        activeCalories: caloriesTotal,
        heartRateAvg,
        heartRateMax,
        heartRateSamples,
        lastHrTime,
        lastPayload: payload,
      },
      update: {
        steps: Math.max(existing?.steps ?? 0, stepsCount),
        activeCalories: Math.max(existing?.activeCalories ?? 0, caloriesTotal),
        heartRateAvg,
        heartRateMax,
        heartRateSamples,
        lastHrTime,
        lastPayload: payload,
      },
    });
  }

  const exercises = payload.exercise ?? [];
  for (const ex of exercises) {
    if (!ex.start_time || !ex.end_time) continue;

    const startTime = new Date(ex.start_time);
    const endTime = new Date(ex.end_time);

    const sessionHr = heartRate.filter((s) => {
      if (!s.time || s.bpm == null) return false;
      const t = new Date(s.time).getTime();
      return t >= startTime.getTime() && t <= endTime.getTime();
    });

    const hrStats = sessionHr.reduce(
      (acc, s) => ({
        sum: acc.sum + s.bpm,
        count: acc.count + 1,
        max: Math.max(acc.max, s.bpm),
        min: Math.min(acc.min, s.bpm),
      }),
      { sum: 0, count: 0, max: -Infinity, min: Infinity }
    );

    await prisma.playerExerciseSession.upsert({
      where: { playerId_startTime: { playerId: player.id, startTime } },
      create: {
        playerId: player.id,
        exerciseType: String(ex.type ?? "unknown"),
        startTime,
        endTime,
        durationSeconds: ex.duration_seconds ?? Math.round((endTime - startTime) / 1000),
        heartRateAvg: hrStats.count ? hrStats.sum / hrStats.count : null,
        heartRateMax: hrStats.count ? hrStats.max : null,
        heartRateMin: hrStats.count ? hrStats.min : null,
        heartRateSamples: hrStats.count,
        rawPayload: { exercise: ex, heartRate: sessionHr },
      },
      update: {
        endTime,
        durationSeconds: ex.duration_seconds ?? Math.round((endTime - startTime) / 1000),
        heartRateAvg: hrStats.count ? hrStats.sum / hrStats.count : null,
        heartRateMax: hrStats.count ? hrStats.max : null,
        heartRateMin: hrStats.count ? hrStats.min : null,
        heartRateSamples: hrStats.count,
        rawPayload: { exercise: ex, heartRate: sessionHr },
      },
    });
  }

  return Response.json({ ok: true, days: [...dayKeys], exercises: exercises.length });
}
