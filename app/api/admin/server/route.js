import { isAdmin } from "@/lib/auth";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

function run(cmd) {
  try { return execSync(cmd, { timeout: 5000 }).toString().trim(); } catch { return ""; }
}

export async function GET() {
  if (!(await isAdmin())) {
    return Response.json({ error: "Brak dostępu" }, { status: 403 });
  }

  const memRaw = run("free -b").split("\n")[1]?.split(/\s+/) || [];
  const ram = {
    total: Number(memRaw[1]) || 0,
    used: Number(memRaw[2]) || 0,
    available: Number(memRaw[6]) || 0,
  };

  const swapRaw = run("free -b").split("\n")[2]?.split(/\s+/) || [];
  const swap = {
    total: Number(swapRaw[1]) || 0,
    used: Number(swapRaw[2]) || 0,
  };

  const diskRaw = run("df -B1 /").split("\n")[1]?.split(/\s+/) || [];
  const disk = {
    total: Number(diskRaw[1]) || 0,
    used: Number(diskRaw[2]) || 0,
    available: Number(diskRaw[3]) || 0,
    percent: diskRaw[4] || "0%",
  };

  const cpuCount = Number(run("nproc")) || 1;
  const loadavg = run("cat /proc/loadavg").split(/\s+/).slice(0, 3).map(Number);
  const uptime = run("uptime -p").replace("up ", "");

  const dbUrl = process.env.DATABASE_URL || "";
  const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:\/]+)(?::(\d+))?\/([^?]+)/);
  let dbSize = null;
  let dbTables = [];
  if (match) {
    const [, user, pass, host, port, dbName] = match;
    const env = `PGPASSWORD=${pass}`;
    const conn = `-U ${user} -h ${host} -p ${port || 5432} ${dbName}`;
    const sizeStr = run(`${env} psql ${conn} -t -c "SELECT pg_database_size('${dbName}')" 2>/dev/null`);
    dbSize = Number(sizeStr) || 0;
    const tablesStr = run(`${env} psql ${conn} -t -c "SELECT tablename, pg_total_relation_size(quote_ident(tablename)) FROM pg_tables WHERE schemaname='public' ORDER BY 2 DESC LIMIT 15" 2>/dev/null`);
    dbTables = tablesStr.split("\n").filter(Boolean).map((line) => {
      const [name, size] = line.split("|").map((s) => s.trim());
      return { name, size: Number(size) || 0 };
    });
  }

  let docker = [];
  const dockerStr = run("sudo docker stats --no-stream --format '{{.Name}}|{{.MemUsage}}|{{.CPUPerc}}' 2>/dev/null");
  if (dockerStr) {
    docker = dockerStr.split("\n").filter(Boolean).map((line) => {
      const [name, mem, cpu] = line.split("|");
      return { name, mem, cpu };
    });
  }

  return Response.json({ ram, swap, disk, cpuCount, loadavg, uptime, dbSize, dbTables, docker });
}
