const { execSync } = require("child_process");
const nodemailer = require("nodemailer");
const { PrismaClient } = require("../lib/generated/prisma");

(async () => {
  const prisma = new PrismaClient();
  try {
    const keys = ["smtp_host", "smtp_port", "smtp_email", "smtp_password"];
    const rows = await prisma.ustawienie.findMany({ where: { klucz: { in: keys } } });
    const cfg = Object.fromEntries(rows.map((r) => [r.klucz, r.wartosc]));

    const host = cfg.smtp_host || "smtp.gmail.com";
    const port = parseInt(cfg.smtp_port || "465", 10);
    const email = cfg.smtp_email;
    const password = cfg.smtp_password;

    if (!email || !password) {
      console.log("Brak konfiguracji SMTP — uzupełnij w panelu /panel/serwer");
      return;
    }

    const dbUrl = process.env.DATABASE_URL || "";
    const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:\/]+)(?::(\d+))?\/([^?]+)/);
    if (!match) { console.error("Brak DATABASE_URL"); return; }
    const [, user, pass, dbHost, dbPort, dbName] = match;

    const dump = execSync(
      `PGPASSWORD=${pass} pg_dump -Fc -U ${user} -h ${dbHost} -p ${dbPort || 5432} ${dbName}`,
      { timeout: 30000, maxBuffer: 50 * 1024 * 1024 },
    );

    const date = new Date().toISOString().slice(0, 10);
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user: email, pass: password },
    });

    await transporter.sendMail({
      from: `"MKS Drawa Backup" <${email}>`,
      to: email,
      subject: `Backup bazy — ${date}`,
      text: `Automatyczny backup bazy danych drawa_fc z dnia ${date}.\n\nPrzywracanie: pg_restore -U drawa -d drawa_fc plik.dump`,
      attachments: [{ filename: `drawa_fc_${date}.dump`, content: dump }],
    });

    console.log(`Backup wysłany na ${email} (${(dump.length / 1024).toFixed(0)} KB)`);
  } catch (e) {
    console.error("Błąd backup-email:", e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
