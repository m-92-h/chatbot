import { GEMINI } from "@/lib/service/gemini.service";
import { type NextRequest } from "next/server";

// Vercel max duration for streaming responses
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const sendEvent = (
    controller: ReadableStreamDefaultController,
    payload: Record<string, unknown>,
  ) => {
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
    );
  };

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await req.json();
        const { message } = body as { message?: string };

        if (!message || typeof message !== "string") {
          sendEvent(controller, {
            type: "error",
            text: "The message is required.",
          });
          controller.close();
          return;
        }

        await GEMINI.generateResponse(
          message,
          (chunk: string) => {
            if (chunk) sendEvent(controller, { type: "chunk", text: chunk });
          },
          (theme: "light" | "dark" | "toggle") => {
            sendEvent(controller, { type: "theme", value: theme });
          },
        );

        sendEvent(controller, { type: "done" });
      } catch (error) {
        const errMessage =
          error instanceof Error ? error.message : String(error);
        console.error("[Chat API Error]:", errMessage);
        sendEvent(controller, {
          type: "error",
          text: "عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}