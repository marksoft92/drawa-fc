import { getPlayerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return Response.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
}

export async function POST(request) {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { endpoint, keys } = await request.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return Response.json({ error: "Nieprawidłowe dane subskrypcji" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: session.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { userId: session.user.id, p256dh: keys.p256dh, auth: keys.auth },
  });

  return Response.json({ ok: true }, { status: 201 });
}

export async function DELETE(request) {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { endpoint } = await request.json();
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: session.user.id } });
  } else {
    await prisma.pushSubscription.deleteMany({ where: { userId: session.user.id } });
  }

  return Response.json({ ok: true });
}
