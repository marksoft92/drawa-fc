import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) {
    return new Response("Brak tokenu", { status: 400 });
  }

  const sub = await prisma.newsletterSub.findUnique({ where: { token } });
  if (!sub) {
    return new Response(html("Nie znaleziono subskrypcji."), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  await prisma.newsletterSub.update({ where: { token }, data: { active: false } });

  return new Response(html("Wypisano z newslettera MKS Drawa Drawno. Możesz zamknąć tę stronę."), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function html(msg) {
  return `<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Newsletter — MKS Drawa</title></head><body style="background:#030712;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0"><div style="text-align:center;max-width:400px;padding:20px"><img src="/logo.png" width="64" height="64" alt=""><p style="margin-top:20px;color:#94a3b8">${msg}</p><a href="/" style="color:#3b82f6;font-size:13px">Wróć na stronę</a></div></body></html>`;
}
