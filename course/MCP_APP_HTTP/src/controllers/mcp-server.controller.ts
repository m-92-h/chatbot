import { Request, Response } from "express";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import {
  createMcpServer,
  createSessionTransport,
  getSessionTransport,
} from "../mcp/server/mcpServer.js";

export class McpServerController {
  static async handlePost(req: Request, res: Response) {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport = getSessionTransport(sessionId);

    if (!transport && isInitializeRequest(req.body)) {
      transport = createSessionTransport();
      
      // إنشاء نسخة سيرفر مستقلة وربطها بالـ Transport الخاص بهذه الجلسة
      const server = createMcpServer();
      await server.connect(transport);
    }

    if (!transport) {
      return res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Invalid or missing session ID" },
        id: null,
      });
    }

    await transport.handleRequest(req, res, req.body);
  }

  static async handleGet(req: Request, res: Response) {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    const transport = getSessionTransport(sessionId);

    if (!transport) return res.status(400).send("Invalid or missing session ID");
    await transport.handleRequest(req, res);
  }
}