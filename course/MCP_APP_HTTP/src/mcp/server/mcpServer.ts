import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "node:crypto";
import registerBmiTool from "./tools/bmi.tool.js";
import registerTimeTool from "./tools/time.tool.js";

// دالة تصنيع لإنشاء سيرفر جديد مستقل
export function createMcpServer() {
  const server = new McpServer({
    name: "demo-mcp-server",
    version: "1.0.0",
  });

  registerBmiTool(server);
  registerTimeTool(server);

  return server;
}

const sessionTransports: Record<string, StreamableHTTPServerTransport> = {};

export function createSessionTransport() {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    enableJsonResponse: true,
    onsessioninitialized: (sessionId) => {
      sessionTransports[sessionId] = transport;
    },
  });

  transport.onclose = () => {
    if (transport.sessionId) {
      delete sessionTransports[transport.sessionId];
    }
  };

  return transport;
}

export function getSessionTransport(sessionId?: string) {
  return sessionId ? sessionTransports[sessionId] : undefined;
}