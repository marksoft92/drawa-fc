import { getPlayerSession } from "@/lib/auth";
import { dmEmitter } from "@/lib/dmEmitter";

export const dynamic = "force-dynamic";

function convKey(a, b) { return [a, b].sort().join(":"); }

export async function GET(request, { params }) {
  const session = await getPlayerSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const myId = session.user.id;
  const { userId } = await params;

  const channel = convKey(myId, userId);

  const encoder = new TextEncoder();
  let controller;

  const stream = new ReadableStream({
    start(c) { controller = c; },
    cancel() { dmEmitter.off(channel, send); },
  });

  function send(data) {
    try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch {}
  }

  dmEmitter.on(channel, send);

  const ping = setInterval(() => {
    try { controller.enqueue(encoder.encode(": ping\n\n")); } catch { clearInterval(ping); }
  }, 25000);

  request.signal.addEventListener("abort", () => {
    clearInterval(ping);
    dmEmitter.off(channel, send);
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
