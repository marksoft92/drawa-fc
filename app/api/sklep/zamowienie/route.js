import { prisma } from "@/lib/prisma";
import { createTransport } from "@/lib/mailer";
import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(`order:${ip}`);
  if (rl.blocked) return Response.json({ error: "Za dużo prób, spróbuj później" }, { status: 429 });

  const body = await request.json();
  const { imie, email, telefon, ulica, kodPocztowy, miasto, uwagi, pozycje } = body;

  if (!imie?.trim() || !email?.trim() || !telefon?.trim() || !ulica?.trim() || !kodPocztowy?.trim() || !miasto?.trim()) {
    return Response.json({ error: "Wypełnij wszystkie wymagane pola" }, { status: 400 });
  }
  if (!Array.isArray(pozycje) || pozycje.length === 0) {
    return Response.json({ error: "Koszyk jest pusty" }, { status: 400 });
  }

  const produktIds = pozycje.map(p => p.produktId);
  const produkty = await prisma.produkt.findMany({ where: { id: { in: produktIds }, published: true } });
  const produktMap = new Map(produkty.map(p => [p.id, p]));

  for (const poz of pozycje) {
    const prod = produktMap.get(poz.produktId);
    if (!prod) return Response.json({ error: `Produkt "${poz.nazwa || poz.produktId}" jest niedostępny` }, { status: 400 });

    if (poz.wariant) {
      const w = prod.warianty.find(v => v.nazwa === poz.wariant);
      if (!w) return Response.json({ error: `Wariant "${poz.wariant}" produktu "${prod.nazwa}" nie istnieje` }, { status: 400 });
      if (w.stan < poz.ilosc) return Response.json({ error: `Niewystarczający stan "${prod.nazwa}" (${poz.wariant}): dostępne ${w.stan}` }, { status: 400 });
    } else {
      if (prod.stan < poz.ilosc) return Response.json({ error: `Niewystarczający stan "${prod.nazwa}": dostępne ${prod.stan}` }, { status: 400 });
    }
  }

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const todayCount = await prisma.zamowienie.count({
    where: { numer: { startsWith: `ZAM-${today}` } },
  });
  const numer = `ZAM-${today}-${String(todayCount + 1).padStart(3, "0")}`;

  let kwota = 0;
  const pozycjeData = pozycje.map(poz => {
    const prod = produktMap.get(poz.produktId);
    const subtotal = prod.cena * poz.ilosc;
    kwota += subtotal;
    return {
      produktId: prod.id,
      nazwaSnapshot: prod.nazwa,
      wariant: poz.wariant || null,
      ilosc: poz.ilosc,
      cena: prod.cena,
    };
  });

  const zamowienie = await prisma.$transaction(async (tx) => {
    for (const poz of pozycje) {
      const prod = produktMap.get(poz.produktId);
      if (poz.wariant) {
        const newWarianty = prod.warianty.map(v =>
          v.nazwa === poz.wariant ? { ...v, stan: v.stan - poz.ilosc } : v
        );
        await tx.produkt.update({ where: { id: prod.id }, data: { warianty: newWarianty } });
      } else {
        await tx.produkt.update({ where: { id: prod.id }, data: { stan: { decrement: poz.ilosc } } });
      }
    }

    return tx.zamowienie.create({
      data: {
        numer,
        imie: imie.trim(),
        email: email.trim(),
        telefon: telefon.trim(),
        ulica: ulica.trim(),
        kodPocztowy: kodPocztowy.trim(),
        miasto: miasto.trim(),
        uwagi: uwagi?.trim() || null,
        kwota,
        pozycje: { create: pozycjeData },
      },
    });
  });

  try {
    const { transporter, email: fromEmail } = await createTransport();
    const itemsHtml = pozycjeData.map(p =>
      `<tr><td style="padding:6px 10px;border-bottom:1px solid #e2e8f0">${p.nazwaSnapshot}${p.wariant ? ` (${p.wariant})` : ""}</td><td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:center">${p.ilosc}</td><td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:right">${(p.cena * p.ilosc / 100).toFixed(2)} zł</td></tr>`
    ).join("");

    const html = `
      <div style="max-width:560px;margin:0 auto;font-family:-apple-system,'Segoe UI',sans-serif">
        <div style="text-align:center;padding:24px 0;border-bottom:2px solid #3b82f6">
          <img src="https://mksdrawadrawno.pl/logo.png" width="48" height="48" alt="MKS Drawa" style="margin-bottom:8px">
          <div style="font-size:18px;font-weight:700;color:#0f172a">MKS Drawa Drawno — Sklep</div>
        </div>
        <div style="padding:28px 0">
          <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a">Potwierdzenie zamówienia</h2>
          <p style="margin:0 0 20px;color:#475569;font-size:14px">Numer zamówienia: <strong>${numer}</strong></p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;color:#1e293b">
            <thead><tr style="background:#f1f5f9"><th style="padding:8px 10px;text-align:left">Produkt</th><th style="padding:8px 10px;text-align:center">Ilość</th><th style="padding:8px 10px;text-align:right">Kwota</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot><tr><td colspan="2" style="padding:10px;font-weight:700;text-align:right">Razem:</td><td style="padding:10px;font-weight:700;text-align:right;font-size:16px">${(kwota / 100).toFixed(2)} zł</td></tr></tfoot>
          </table>
          <div style="margin-top:24px;padding:16px;background:#f8fafc;border-radius:8px;font-size:13px;color:#475569">
            <strong>Adres dostawy:</strong><br>
            ${imie.trim()}<br>${ulica.trim()}<br>${kodPocztowy.trim()} ${miasto.trim()}<br>
            Tel: ${telefon.trim()}<br>Email: ${email.trim()}
            ${uwagi?.trim() ? `<br><br><strong>Uwagi:</strong> ${uwagi.trim()}` : ""}
          </div>
          <p style="margin:24px 0 0;font-size:14px;color:#475569;line-height:1.6">
            Skontaktujemy się z Tobą w sprawie płatności i realizacji zamówienia.
          </p>
        </div>
        <div style="text-align:center;padding:16px 0;border-top:1px solid #e2e8f0">
          <a href="https://mksdrawadrawno.pl" style="color:#3b82f6;font-size:12px;text-decoration:none">mksdrawadrawno.pl</a>
        </div>
      </div>`;

    await transporter.sendMail({
      from: `"MKS Drawa Drawno" <${fromEmail}>`,
      to: email.trim(),
      subject: `Zamówienie ${numer} — MKS Drawa Drawno`,
      html,
    });
  } catch {}

  return Response.json({ ok: true, numer: zamowienie.numer });
}
