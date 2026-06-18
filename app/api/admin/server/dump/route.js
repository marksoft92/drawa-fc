import { isAdmin } from "@/lib/auth";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) {
    return Response.json({ error: "Brak dostępu" }, { status: 403 });
  }

  const dbUrl = process.env.DATABASE_URL || "";
  const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:\/]+)(?::(\d+))?\/([^?]+)/);
  if (!match) {
    return Response.json({ error: "Brak konfiguracji bazy" }, { status: 500 });
  }

  const [, user, pass, host, port, dbName] = match;

  try {
    const dump = execSync(
      `PGPASSWORD=${pass} pg_dump -Fc -U ${user} -h ${host} -p ${port || 5432} ${dbName}`,
      { timeout: 30000, maxBuffer: 50 * 1024 * 1024 },
    );

    const date = new Date().toISOString().slice(0, 10);
    return new Response(dump, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="drawa_fc_${date}.dump"`,
      },
    });
  } catch {
    return Response.json({ error: "Błąd tworzenia dumpa" }, { status: 500 });
  }
}
