import { getPlayerSession } from "@/lib/auth";
import { validateImageBytes } from "@/lib/validateImage";
import { saveImage } from "@/lib/saveImage";
import { prisma } from "@/lib/prisma";
import { chatEmitter } from "@/lib/chatEmitter";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(request) {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") return Response.json({ error: "Brak pliku" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return Response.json({ error: "Tylko obrazy (JPG, PNG, WebP, GIF)" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_SIZE) return Response.json({ error: "Maks. 10 MB" }, { status: 400 });

  if (!validateImageBytes(bytes, file.type)) {
    return Response.json({ error: "Plik nie jest prawidłowym obrazem" }, { status: 400 });
  }

  let plik;
  if (file.type === "image/gif") {
    const filename = `chat-${Date.now()}-${randomBytes(4).toString("hex")}.gif`;
    await writeFile(join(process.cwd(), "public", "uploads", filename), Buffer.from(bytes));
    plik = `/uploads/${filename}`;
  } else {
    plik = await saveImage(bytes, "chat");
  }

  const msg = await prisma.chatWiadomosc.create({
    data: {
      id: randomBytes(8).toString("hex"),
      typ: "image",
      plik,
      authorId: session.user.id,
    },
    include: {
      author: { select: { id: true, login: true, player: { select: { imieNazwisko: true, foto: true } } } },
      reakcje: true,
    },
  });

  const formatted = {
    id: msg.id,
    tresc: null,
    typ: "image",
    plik,
    usunieta: false,
    createdAt: msg.createdAt,
    editedAt: null,
    author: {
      id: msg.author.id,
      name: msg.author.player?.imieNazwisko ?? msg.author.login,
      initials: (msg.author.player?.imieNazwisko ?? msg.author.login).charAt(0).toUpperCase(),
      foto: msg.author.player?.foto ?? null,
      isMe: true,
    },
    reakcje: {},
  };

  chatEmitter.emit("event", { type: "message", data: formatted });

  return Response.json(formatted, { status: 201 });
}
