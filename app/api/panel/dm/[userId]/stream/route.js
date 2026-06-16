import { getPlayerSession } from "@/lib/auth";
import { chatEmitter } from "@/lib/chatEmitter";

export const dynamic = "force-dynamic";

function convKey(a, b) { return [a, b].sort().join(":"); }

export async function GET(request, { params }) {
  const session = await getPlayerSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const myId = session.user.id;
  const { userId } = await params;

  const eventName = "dm:" + convKey(myId, userId);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch {}
      };

      chatEmitter.on(eventName, send);

      const ping = setInterval(() => {
        try { controller.enqueue(encoder.encode(": ping\n\n")); } catch { clearInterval(ping); }
      }, 25000);

      request.signal.addEventListener("abort", () => {
        clearInterval(ping);
        chatEmitter.off(eventName, send);
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
