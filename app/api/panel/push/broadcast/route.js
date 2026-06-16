import { getPlayerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function POST(request) {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  if (!["ADMIN", "STAFF"].includes(session.user.role)) {
    return Response.json({ error: "Brak uprawnień" }, { status: 403 });
  }

  const { title, body, url } = await request.json();
  if (!title?.trim() || !body?.trim()) {
    return Response.json({ error: "Tytuł i treść są wymagane" }, { status: 400 });
  }

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: { not: session.user.id } },
  });

  const payload = JSON.stringify({
    title: title.trim(),
    body: body.trim(),
    url: url?.trim() || "/panel",
    tag: "broadcast-" + Date.now(),
  });

  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush
        .sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
        .catch(() => prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {}))
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return Response.json({ ok: true, sent, total: subs.length });
}
