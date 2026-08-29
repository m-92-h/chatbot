import express, { type Request, type Response } from "express";
import cors from "cors";
import path from "node:path";
import { registerMcpHandler } from "./mcp/mcpServer.js";
import { GEMINI } from "./services/gemini.service.js";

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(process.cwd(), "public")));

// MCP server registration
registerMcpHandler(app);

app.post("/api/chat", async (req: Request, res: Response) => {
  // تفعيل SSE
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendEvent = (payload: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      sendEvent({ type: "error", text: "The message is required." });
      res.end();
      return;
    }

    // ارسال مسج المستخدم والحصول على رد من النموذج بشكل مقاطع
    // وايضا قيمة تغيير اللثيم في حال استخدامها
    await GEMINI.generateResponse(
      message,
      (chunk: string) => {
        if (chunk) sendEvent({ type: "chunk", text: chunk });
      },
      (theme) => {
        sendEvent({ type: "theme", value: theme });
      },
    );

    sendEvent({ type: "done" });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error("[Chat API Error]:", errMessage);
    sendEvent({ type: "error", text: "عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى." });
  } finally {
    res.end();
  }
});

// Exporting the app to use the Vercel Serverless Function
export default app;

// Run the server locally only during development.
if (process.env.NODE_ENV !== "production") {
  const PORT: number = Number(process.env.PORT) || 3000;
  app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
    console.log(`[MCP Endpoint] Ready at http://localhost:${PORT}/mcp`);
  });
}
