import { prisma } from "@/lib/prisma";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/** Wysyła powiadomienie push do wszystkich subskrybentów (kibice + gracze/staff). */
export async function notifyAll({ title, body, url = "/", tag }) {
  if (!process.env.VAPID_PRIVATE_KEY) return;

  const subs = await prisma.pushSubscription.findMany();
  if (subs.length === 0) return;

  const payload = JSON.stringify({ title, body, url, tag: tag || "auto-" + Date.now() });

  await Promise.allSettled(
    subs.map((s) =>
      webpush
        .sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
        .catch((err) => {
          // subskrypcja martwa (wygasła/odinstalowana) — sprzątamy
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            return prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
          }
        })
    )
  );
}
