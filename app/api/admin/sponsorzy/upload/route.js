import { isAdmin } from "@/lib/auth";
import { validateImageBytes } from "@/lib/validateImage";
import { saveImage } from "@/lib/saveImage";
import { writeFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") return Response.json({ error: "Brak pliku" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return Response.json({ error: "Dozwolone formaty: JPG, PNG, WebP, GIF, SVG" }, { status: 400 });
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_SIZE) return Response.json({ error: "Maksymalny rozmiar: 5 MB" }, { status: 400 });

  if (!validateImageBytes(bytes, file.type)) {
    return Response.json({ error: "Plik nie jest prawidłowym obrazem" }, { status: 400 });
  }

  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    const ext = file.type === "image/gif" ? ".gif" : ".svg";
    const filename = `sponsor-${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`;
    await writeFile(join(process.cwd(), "public", "uploads", filename), Buffer.from(bytes));
    return Response.json({ url: `/uploads/${filename}` });
  }

  const url = await saveImage(bytes, "sponsor");
  return Response.json({ url });
}
