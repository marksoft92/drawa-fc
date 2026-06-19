import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTransport } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) {
    return Response.json({ error: "Brak dostępu" }, { status: 403 });
  }

  const subs = await prisma.newsletterSub.findMany({
    orderBy: { createdAt: "desc" },
  });
  const active = subs.filter((s) => s.active).length;
  return Response.json({ subs, active, total: subs.length });
}

export async function POST(request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Brak dostępu" }, { status: 403 });
  }

  const { subject, html } = await request.json();
  if (!subject || !html) {
    return Response.json({ error: "Podaj temat i treść" }, { status: 400 });
  }

  let transport;
  try {
    transport = await createTransport();
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 });
  }

  const subs = await prisma.newsletterSub.findMany({
    where: { active: true },
  });

  if (subs.length === 0) {
    return Response.json({ error: "Brak aktywnych subskrybentów" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mksdrawadrawno.pl";
  let sent = 0;
  let failed = 0;

  for (const sub of subs) {
    const unsubLink = `${baseUrl}/api/newsletter/unsubscribe?token=${sub.token}`;
    const fullHtml = `${html}<br><hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0 16px"><p style="font-size:11px;color:#94a3b8;text-align:center">Otrzymujesz ten email, bo zapisałeś się do newslettera MKS Drawa Drawno.<br><a href="${unsubLink}" style="color:#3b82f6">Wypisz się z newslettera</a></p>`;

    try {
      await transport.transporter.sendMail({
        from: `"MKS Drawa Drawno" <${transport.email}>`,
        to: sub.email,
        subject,
        html: fullHtml,
      });
      sent++;
    } catch {
      failed++;
    }
  }

  return Response.json({ ok: true, sent, failed });
}

export async function DELETE(request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Brak dostępu" }, { status: 403 });
  }
  const { id } = await request.json();
  await prisma.newsletterSub.delete({ where: { id } });
  return Response.json({ ok: true });
}
