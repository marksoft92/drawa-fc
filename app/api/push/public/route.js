import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
}

export async function POST(request) {
  const { endpoint, keys } = await request.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return Response.json({ error: "Nieprawidłowe dane subskrypcji" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { p256dh: keys.p256dh, auth: keys.auth },
  });

  return Response.json({ ok: true }, { status: 201 });
}

export async function DELETE(request) {
  const { endpoint } = await request.json();
  if (!endpoint) return Response.json({ error: "Brak endpointu" }, { status: 400 });
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  return Response.json({ ok: true });
}
