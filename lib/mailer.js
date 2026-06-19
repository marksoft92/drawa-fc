import nodemailer from "nodemailer";
import { prisma } from "./prisma";

export async function getSmtpSettings() {
  const keys = ["smtp_host", "smtp_port", "smtp_email", "smtp_password"];
  const rows = await prisma.ustawienie.findMany({
    where: { klucz: { in: keys } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.klucz, r.wartosc]));
  return {
    host: map.smtp_host || "smtp.gmail.com",
    port: parseInt(map.smtp_port || "465", 10),
    email: map.smtp_email || "",
    password: map.smtp_password || "",
  };
}

export async function createTransport() {
  const cfg = await getSmtpSettings();
  if (!cfg.email || !cfg.password) {
    throw new Error("Brak konfiguracji SMTP — uzupełnij w panelu /panel/serwer");
  }
  return {
    transporter: nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: { user: cfg.email, pass: cfg.password },
    }),
    email: cfg.email,
  };
}
