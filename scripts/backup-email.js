const { execSync } = require("child_process");
const nodemailer = require("nodemailer");
const { PrismaClient } = require("../lib/generated/prisma");

(async () => {
  const prisma = new PrismaClient();
  try {
    const emailRow = await prisma.ustawienie.findUnique({ where: { klucz: "backup_email" } });
    const passRow = await prisma.ustawienie.findUnique({ where: { klucz: "backup_password" } });
    const email = emailRow?.wartosc;
    const password = passRow?.wartosc;
    if (!email || !password) {
      console.log("Brak konfiguracji email backup — uzupełnij w panelu /panel/serwer");
      return;
    }

    const dbUrl = process.env.DATABASE_URL || "";
    const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:\/]+)(?::(\d+))?\/([^?]+)/);
    if (!match) { console.error("Brak DATABASE_URL"); return; }
    const [, user, pass, host, port, dbName] = match;

    const dump = execSync(
      `PGPASSWORD=${pass} pg_dump -Fc -U ${user} -h ${host} -p ${port || 5432} ${dbName}`,
      { timeout: 30000, maxBuffer: 50 * 1024 * 1024 },
    );

    const date = new Date().toISOString().slice(0, 10);
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
      attachments: [{ filename: `drawa_fc_${date}.dump`, content: dump }],
    });

    console.log(`Backup wysłany na ${email} (${(dump.length / 1024).toFixed(0)} KB)`);
  } catch (e) {
    console.error("Błąd backup-email:", e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
