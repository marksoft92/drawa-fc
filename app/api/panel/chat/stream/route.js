import { getPlayerSession } from "@/lib/auth";
import { chatEmitter } from "@/lib/chatEmitter";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getPlayerSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {}
      };

      send({ type: "connected", userId: session.user.id });

      chatEmitter.on("event", send);

      const ping = setInterval(() => {
        if (closed) { clearInterval(ping); return; }
        try { controller.enqueue(encoder.encode(": ping\n\n")); } catch {}
      }, 25000);

      request.signal.addEventListener("abort", () => {
        closed = true;
        chatEmitter.off("event", send);
        clearInterval(ping);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
