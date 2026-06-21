import { hasAccess } from "@/lib/auth";
import { validateImageBytes } from "@/lib/validateImage";
import { saveImage } from "@/lib/saveImage";

export const dynamic = "force-dynamic";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(request) {
  if (!(await hasAccess("sklep"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") return Response.json({ error: "Brak pliku" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return Response.json({ error: "Dozwolone: JPG, PNG, WebP" }, { status: 400 });
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_SIZE) return Response.json({ error: "Maks. 10 MB" }, { status: 400 });

  if (!validateImageBytes(bytes, file.type)) {
    return Response.json({ error: "Plik nie jest prawidłowym obrazem" }, { status: 400 });
  }

  const url = await saveImage(bytes, "produkt");
  return Response.json({ url });
}
