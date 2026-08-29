import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerThemeTool(server: McpServer): void {
  console.log("[MCP] Registering change_site_theme tool...");

  server.registerTool(
    "change_site_theme",
    {
      title: "Change website theme",
      description: "Change the site's appearance between light and dark modes, or switch between them (toggle). " + "Use this tool when the user requests a change to the theme, appearance, or light/dark mode.",
      inputSchema: z.object({
        theme: z.enum(["light", "dark", "toggle"]).describe("Theme required: light, dark, or toggle"),
      }),
    },
    async ({ theme }) => {
      const humanMessage = theme === "toggle" ? "تم تبديل الثيم ✓" : theme === "dark" ? "تم التبديل إلى الوضع الداكن 🌙" : "تم التبديل إلى الوضع المشرق ☀️";

      return {
        content: [{ type: "text" as const, text: humanMessage }],
      };
    },
  );
}
