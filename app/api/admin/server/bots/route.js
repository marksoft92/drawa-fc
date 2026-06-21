import { hasAccess } from "@/lib/auth";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

const BOT_PATTERN = "bot|crawl|spider|slurp|semrush|ahref|mj12|dotbot|yandex|bingpreview|facebookexternalhit|Twitterbot|WhatsApp|Telegram|curl|wget|python|Go-http|HeadlessChrome|GPTBot|OAI-SearchBot|Bytespider|ClaudeBot|CCBot|PetalBot|DataForSeo|Sogou|Baiduspider|DuckDuckBot|ia_archiver|archive.org";

function run(cmd) {
  try { return execSync(cmd, { timeout: 10000, maxBuffer: 5 * 1024 * 1024 }).toString().trim(); } catch { return ""; }
}

export async function GET() {
  if (!(await hasAccess("serwer"))) {
    return Response.json({ error: "Brak dostępu" }, { status: 403 });
  }

  const logFile = "/var/log/nginx/access.log";

  const botsRaw = run(
    `grep -iE '${BOT_PATTERN}' ${logFile} 2>/dev/null | awk -F'"' '{print $6}' | sort | uniq -c | sort -rn | head -20`
  );
  const bots = botsRaw.split("\n").filter(Boolean).map((line) => {
    const m = line.trim().match(/^(\d+)\s+(.+)/);
    if (!m) return null;
    return { count: Number(m[1]), ua: m[2] };
  }).filter(Boolean);

  const botIpsRaw = run(
    `grep -iE '${BOT_PATTERN}' ${logFile} 2>/dev/null | awk '{print $1}' | sort | uniq -c | sort -rn | head -10`
  );
  const botIps = botIpsRaw.split("\n").filter(Boolean).map((line) => {
    const m = line.trim().match(/^(\d+)\s+(.+)/);
    if (!m) return null;
    return { count: Number(m[1]), ip: m[2] };
  }).filter(Boolean);

  const topIpsRaw = run(
    `awk '{print $1}' ${logFile} 2>/dev/null | sort | uniq -c | sort -rn | head -10`
  );
  const topIps = topIpsRaw.split("\n").filter(Boolean).map((line) => {
    const m = line.trim().match(/^(\d+)\s+(.+)/);
    if (!m) return null;
    return { count: Number(m[1]), ip: m[2] };
  }).filter(Boolean);

  const recentBotsRaw = run(
    `grep -iE '${BOT_PATTERN}' ${logFile} 2>/dev/null | tail -20 | awk -F'"' '{split($0,a," "); ip=a[1]; time=a[4]; gsub(/\\[/,"",time); print ip"|"time"|"$2"|"$6}'`
  );
  const recentBots = recentBotsRaw.split("\n").filter(Boolean).map((line) => {
    const [ip, time, request, ua] = line.split("|");
    const path = request ? request.split(" ")[1] || "" : "";
    return { ip, time, path, ua: ua || "" };
  });

  const totalReqs = Number(run(`wc -l < ${logFile} 2>/dev/null`)) || 0;
  const botReqs = Number(run(`grep -ciE '${BOT_PATTERN}' ${logFile} 2>/dev/null`)) || 0;

  return Response.json({ bots, botIps, topIps, recentBots, totalReqs, botReqs });
}
