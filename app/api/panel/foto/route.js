import { getPlayerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request) {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const playerId = session.user.player?.id;
  if (!playerId) return Response.json({ error: "Brak profilu gracza" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("foto");

  if (!file || typeof file === "string") {
    return Response.json({ error: "Brak pliku" }, { status: 400 });
  }

  if (!ALLOWED.includes(file.type)) {
    return Response.json({ error: "Dozwolone formaty: JPG, PNG, WebP" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_SIZE) {
    return Response.json({ error: "Maksymalny rozmiar pliku: 5 MB" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `${playerId}.${ext}`;
  const path = join(process.cwd(), "public", "kadra", "uploads", filename);

  await writeFile(path, Buffer.from(bytes));

  const fotoUrl = `/kadra/uploads/${filename}`;
  await prisma.player.update({ where: { id: playerId }, data: { foto: fotoUrl } });

  return Response.json({ ok: true, foto: fotoUrl });
}
