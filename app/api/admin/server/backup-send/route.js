import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { execSync } from "child_process";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

async function getSetting(key) {
  const row = await prisma.ustawienie.findUnique({ where: { klucz: key } });
  return row?.wartosc || "";
}

export async function POST() {
  if (!(await isAdmin())) {
    return Response.json({ error: "Brak dostępu" }, { status: 403 });
  }

  const email = await getSetting("backup_email");
  const password = await getSetting("backup_password");

  if (!email || !password) {
    return Response.json({ error: "Brak konfiguracji email — uzupełnij w ustawieniach serwera" }, { status: 400 });
  }

  const dbUrl = process.env.DATABASE_URL || "";
  const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:\/]+)(?::(\d+))?\/([^?]+)/);
  if (!match) {
    return Response.json({ error: "Brak konfiguracji bazy" }, { status: 500 });
  }

  const [, user, pass, host, port, dbName] = match;

  let dump;
  try {
    dump = execSync(
      `PGPASSWORD=${pass} pg_dump -Fc -U ${user} -h ${host} -p ${port || 5432} ${dbName}`,
      { timeout: 30000, maxBuffer: 50 * 1024 * 1024 },
    );
  } catch {
    return Response.json({ error: "Błąd tworzenia dumpa" }, { status: 500 });
  }

  const date = new Date().toISOString().slice(0, 10);

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: email, pass: password },
    });

    await transporter.sendMail({
      from: `"MKS Drawa Backup" <${email}>`,
      to: email,
      subject: `Backup bazy — ${date}`,
      text: `Automatyczny backup bazy danych drawa_fc z dnia ${date}.\n\nPrzywracanie: pg_restore -U drawa -d drawa_fc plik.dump`,
      attachments: [{
        filename: `drawa_fc_${date}.dump`,
        content: dump,
      }],
    });

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: `Błąd wysyłki: ${err.message}` }, { status: 500 });
  }
}
