import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export default function registerTimeTools (mcpServer: McpServer) {
    console.log('Registering Time Tools...');

    mcpServer.registerTool(
    "get_server_time",
    {
      description: "Get current server time and date. Use when user asks about current time or today's date.",
      inputSchema: z.object({}),
    },
    async () => {
      return {
        content: [{ type: "text", text: `Current Server Time: ${new Date().toISOString()}` }],
      };
    }
  );
}