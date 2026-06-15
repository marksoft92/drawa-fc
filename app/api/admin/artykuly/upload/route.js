import { isAdmin } from "@/lib/auth";
import { writeFile } from "fs/promises";
import { join, extname } from "path";

export const dynamic = "force-dynamic";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return Response.json({ error: "Brak pliku" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return Response.json({ error: "Dozwolone formaty: JPG, PNG, WebP, GIF" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_SIZE) {
    return Response.json({ error: "Maksymalny rozmiar: 10 MB" }, { status: 400 });
  }

  const ext = extname(file.name) || (file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg");
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`;
  const path = join(process.cwd(), "public", "aktualnosci", "uploads", filename);

  await writeFile(path, Buffer.from(bytes));

  return Response.json({ url: `/aktualnosci/uploads/${filename}` });
}
