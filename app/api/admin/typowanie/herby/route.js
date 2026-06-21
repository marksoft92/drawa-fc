import { hasAccess } from "@/lib/auth";
import { readdirSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAccess("typowanie"))) return Response.json({ error: "Brak dostępu" }, { status: 403 });

  const dir = join(process.cwd(), "public", "herby");
  const files = readdirSync(dir)
    .filter((f) => /\.(jpg|jpeg|png|webp|svg)$/i.test(f))
    .sort()
    .map((f) => {
      const name = f
        .replace(/\.[^.]+$/, "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return { file: f, name, url: `/herby/${f}` };
    });

  return Response.json(files);
}
