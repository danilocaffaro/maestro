import { NextRequest } from "next/server";
import { eventBus } from "@/lib/event-bus";
import type { StreamEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial ping
      controller.enqueue(
        encoder.encode(`event: connected\ndata: {"teamId":"${teamId}"}\n\n`)
      );

      const handler = (event: StreamEvent) => {
        try {
          const data = JSON.stringify(event.data);
          controller.enqueue(
            encoder.encode(`event: ${event.type}\ndata: ${data}\n\n`)
          );
        } catch {
          // Ignore serialization errors
        }
      };

      const cleanup = eventBus.onTeamEvent(teamId, handler);

      // Keep-alive ping every 15s
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          clearInterval(keepAlive);
        }
      }, 15000);

      // Cleanup on close
      _req.signal.addEventListener("abort", () => {
        cleanup();
        clearInterval(keepAlive);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
