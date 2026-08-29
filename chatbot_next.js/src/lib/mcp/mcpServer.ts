import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerRagTool } from "./tools/rag.tool";
import { registerThemeTool } from "./tools/theme.tool";

/**
 * createMcpServer
 * ---------------
 * مصنع يُعيد نسخة جديدة من McpServer مع جميع الأدوات مُسجَّلة.
 * نُنشئ نسخة جديدة لكل طلب HTTP لأن Next.js Route Handlers
 * لا تحتفظ بحالة بين الطلبات (stateless).
 */
export function createMcpServer(): McpServer {
  console.log("[MCP] Creating MCP Server instance...");

  const server = new McpServer({
    name: "agent_docker",
    version: "1.0.0",
  });

  registerRagTool(server);
  registerThemeTool(server);

  return server;
}