import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import express, { type Request, type Response } from "express";
import { registerRagTool } from "./tools/rag.tool.js";
import { registerThemeTool } from "./tools/theme.tool.js";

function createMcpServer(): McpServer {
  console.log("[MCP] Creating MCP Server Instance...");

  const server = new McpServer({
    name: "agent_docker",
    version: "1.0.0",
  });

  registerRagTool(server);
  registerThemeTool(server);

  return server;
}

export function registerMcpHandler(app: express.Application): void {
  // Gemini الرئيسي لاستقبال طلبات MCP Handler هو الـ
  app.post("/mcp", async (req: Request, res: Response) => {
    try {
      // لكل طلب جديد Server و Transport إنشاء نسخة جديدة من الـ
      const server = createMcpServer();
      const transport = new StreamableHTTPServerTransport({});

      // ثم معالجة الطلب Transport ربط السيرفر بالـ
      await server.connect(transport as Transport);
      await transport.handleRequest(req, res, req.body);

      // تنظيف الموارد بعد انتهاء الاستجابة
      res.on("finish", () => {
        transport.close();
        server.close();
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[MCP] Error handling request from Gemini:", message);

      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
            data: message,
          },
          id: req.body?.id ?? null,
        });
      }
    }
  });

  // حظر باقي الطرق لأن Gemini يتعامل بـ POST فقط
  app.all("/mcp", (_req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method Not Allowed: only POST is supported (MCP 2026-07-28)",
      },
      id: null,
    });
  });
}
