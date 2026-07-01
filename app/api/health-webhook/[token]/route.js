import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function dayBucket(isoString) {
  const d = new Date(isoString);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
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
  const heartRate = payload.heart_rate ?? [];

  const referenceTime = payload.timestamp ?? new Date().toISOString();
  const date = dayBucket(referenceTime);

  const stepsCount = steps.reduce((max, s) => Math.max(max, s.count ?? 0), 0);
  const caloriesTotal = activeCalories.reduce((max, c) => Math.max(max, c.calories ?? 0), 0);

  const existing = await prisma.playerHealthDaily.findUnique({
    where: { playerId_date: { playerId: player.id, date } },
  });

  let heartRateAvg = existing?.heartRateAvg ?? null;
  let heartRateMax = existing?.heartRateMax ?? null;
  let heartRateSamples = existing?.heartRateSamples ?? 0;
  let lastHrTime = existing?.lastHrTime ?? null;

  for (const sample of heartRate) {
    if (!sample.time || sample.bpm == null) continue;
    if (lastHrTime && new Date(sample.time).getTime() === new Date(lastHrTime).getTime()) continue;

    heartRateAvg = heartRateAvg == null
      ? sample.bpm
      : (heartRateAvg * heartRateSamples + sample.bpm) / (heartRateSamples + 1);
    heartRateSamples += 1;
    heartRateMax = heartRateMax == null ? sample.bpm : Math.max(heartRateMax, sample.bpm);
    lastHrTime = sample.time;
  }

  const daily = await prisma.playerHealthDaily.upsert({
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

  return Response.json({ ok: true, date: daily.date, steps: daily.steps });
}
