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

// Health Connect wysyła kroki/kalorie/dystans jako kolejne, niezachodzące na siebie
// przedziały czasowe (od ostatniej synchronizacji) — trzeba je sumować, a nie brać
// max z pojedynczego payloadu, i pilnować znacznika "do którego momentu już policzono",
// żeby ponowny sync (dosync zaległych rekordów) nie zliczył tego samego przedziału dwa razy.
function sumNewWindows(entries, valueField, lastEndIso) {
  const lastEndMs = lastEndIso ? new Date(lastEndIso).getTime() : null;
  const seen = new Set();
  let total = 0;
  let maxEnd = lastEndIso ?? null;

  const sorted = entries
    .filter((e) => e.end_time)
    .sort((a, b) => new Date(a.end_time) - new Date(b.end_time));

  for (const e of sorted) {
    const key = `${e.start_time}|${e.end_time}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const endMs = new Date(e.end_time).getTime();
    if (lastEndMs != null && endMs <= lastEndMs) continue;

    total += e[valueField] ?? 0;
    if (!maxEnd || endMs > new Date(maxEnd).getTime()) maxEnd = e.end_time;
  }

  return { total, lastEnd: maxEnd };
}

function sleepStart(entry) {
  if (entry.stages?.[0]?.start_time) return entry.stages[0].start_time;
  if (entry.session_end_time && entry.duration_seconds != null) {
    return new Date(new Date(entry.session_end_time).getTime() - entry.duration_seconds * 1000).toISOString();
  }
  return null;
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
  const distance = payload.distance ?? [];
  const sleep = (payload.sleep ?? []).map((s) => ({ ...s, start_time: sleepStart(s), end_time: s.session_end_time })).filter((s) => s.start_time);
  const heartRate = (payload.heart_rate ?? []).filter((s) => s.time && s.bpm != null);

  const stepsByDay = groupByDay(steps, "start_time");
  const caloriesByDay = groupByDay(activeCalories, "start_time");
  const distanceByDay = groupByDay(distance, "start_time");
  const sleepByDay = groupByDay(sleep, "start_time");
  const hrByDay = groupByDay(heartRate, "time");

  const dayKeys = new Set([
    ...stepsByDay.keys(), ...caloriesByDay.keys(), ...distanceByDay.keys(), ...sleepByDay.keys(), ...hrByDay.keys(),
  ]);

  for (const dayKey of dayKeys) {
    const date = new Date(dayKey);
    const daySteps = stepsByDay.get(dayKey) ?? [];
    const dayCalories = caloriesByDay.get(dayKey) ?? [];
    const dayDistance = distanceByDay.get(dayKey) ?? [];
    const daySleep = sleepByDay.get(dayKey) ?? [];
    const dayHr = (hrByDay.get(dayKey) ?? []).sort((a, b) => new Date(a.time) - new Date(b.time));

    const existing = await prisma.playerHealthDaily.findUnique({
      where: { playerId_date: { playerId: player.id, date } },
    });

    const stepsResult = sumNewWindows(daySteps, "count", existing?.lastStepsEnd);
    const caloriesResult = sumNewWindows(dayCalories, "calories", existing?.lastCaloriesEnd);
    const distanceResult = sumNewWindows(dayDistance, "meters", existing?.lastDistanceEnd);
    const sleepResult = sumNewWindows(daySleep, "duration_seconds", existing?.lastSleepEnd);

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
        steps: stepsResult.total,
        activeCalories: caloriesResult.total,
        distanceMeters: distanceResult.total,
        sleepMinutes: Math.round(sleepResult.total / 60),
        lastStepsEnd: stepsResult.lastEnd,
        lastCaloriesEnd: caloriesResult.lastEnd,
        lastDistanceEnd: distanceResult.lastEnd,
        lastSleepEnd: sleepResult.lastEnd,
        heartRateAvg,
        heartRateMax,
        heartRateSamples,
        lastHrTime,
        lastPayload: payload,
      },
      update: {
        steps: (existing?.steps ?? 0) + stepsResult.total,
        activeCalories: (existing?.activeCalories ?? 0) + caloriesResult.total,
        distanceMeters: (existing?.distanceMeters ?? 0) + distanceResult.total,
        sleepMinutes: (existing?.sleepMinutes ?? 0) + Math.round(sleepResult.total / 60),
        lastStepsEnd: stepsResult.lastEnd,
        lastCaloriesEnd: caloriesResult.lastEnd,
        lastDistanceEnd: distanceResult.lastEnd,
        lastSleepEnd: sleepResult.lastEnd,
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
