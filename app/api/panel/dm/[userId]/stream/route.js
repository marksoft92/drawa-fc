import { getPlayerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dmEmitter } from "@/lib/dmEmitter";

export const dynamic = "force-dynamic";

function convKey(a, b) { return [a, b].sort(); }

export async function GET(request, { params }) {
  const session = await getPlayerSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const myId = session.user.id;
  const { userId } = await params;

  const [u1, u2] = convKey(myId, userId);
  const conv = await prisma.privateConversation.findUnique({
    where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
  });
  const convId = conv?.id ?? null;

  const encoder = new TextEncoder();
  let controller;

  const stream = new ReadableStream({
    start(c) { controller = c; },
    cancel() { dmEmitter.off("event", handler); },
  });

  function send(data) {
    try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch {}
  }

  function handler(evt) {
    if (evt.convId !== convId) return;
    send(evt);
  }

  dmEmitter.on("event", handler);

  const ping = setInterval(() => {
    try { controller.enqueue(encoder.encode(": ping\n\n")); } catch { clearInterval(ping); }
  }, 25000);

  request.signal.addEventListener("abort", () => {
    clearInterval(ping);
    dmEmitter.off("event", handler);
    try { controller.close(); } catch {}
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
