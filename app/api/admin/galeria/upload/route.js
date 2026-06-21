import { hasAccess } from "@/lib/auth";
import { validateImageBytes } from "@/lib/validateImage";
import { saveImage } from "@/lib/saveImage";
import { writeFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 15 * 1024 * 1024;

export async function POST(request) {
  if (!(await hasAccess("galeria"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") return Response.json({ error: "Brak pliku" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return Response.json({ error: "Dozwolone: JPG, PNG, WebP, GIF" }, { status: 400 });
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_SIZE) return Response.json({ error: "Maks. 15 MB" }, { status: 400 });

  if (!validateImageBytes(bytes, file.type)) {
    return Response.json({ error: "Plik nie jest prawidłowym obrazem" }, { status: 400 });
  }

  if (file.type === "image/gif") {
    const filename = `galeria-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.gif`;
    await writeFile(join(process.cwd(), "public", "uploads", filename), Buffer.from(bytes));
    return Response.json({ url: `/uploads/${filename}` });
  }

  const url = await saveImage(bytes, "galeria");
  return Response.json({ url });
}
