import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { Express } from "express";
import { z } from "zod";

// دالة تصنيع لإنشاء سيرفر MCP جديد لكل جلسة اتصال
export function createMcpServer() {
  const mcpServer = new McpServer({
    name: "demo-mcp-server",
    version: "1.0.0",
  });

  // 1. تسجيل أداة حساب الـ BMI
  mcpServer.registerTool(
    "calculate_bmi",
    {
      description: "Calculate Body Mass Index (BMI). Use when user asks to calculate BMI or health weight status based on weight and height.",
      inputSchema: z.object({
        weightKg: z.number().describe("Weight in kilograms"),
        heightMeters: z.number().describe("Height in meters (e.g. 1.75)"),
      }),
    },
    async ({ weightKg, heightMeters }) => {
      const bmi = (weightKg / (heightMeters * heightMeters)).toFixed(2);
      let category = "Normal weight";
      const numericBmi = parseFloat(bmi);
      if (numericBmi < 18.5) category = "Underweight";
      else if (numericBmi >= 25 && numericBmi < 29.9) category = "Overweight";
      else if (numericBmi >= 30) category = "Obesity";

      return {
        content: [{ type: "text", text: `BMI: ${bmi} | Category: ${category}` }],
      };
    }
  );

  // 2. تسجيل أداة معرفة وقت السيرفر
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

  return mcpServer;
}

// إدارة اتصالات الـ SSE لربطها بـ Express
const transports = new Map<string, SSEServerTransport>();

export function setupMcpRoutes(app: Express) {
  app.get("/mcp/sse", async (req, res) => {
    try {
      const transport = new SSEServerTransport("/mcp/messages", res);
      transports.set(transport.sessionId, transport);

      // إنشاء نسخة جديدة من السيرفر خاصة بهذا الاتصال
      const server = createMcpServer();

      req.on("close", () => {
        transports.delete(transport.sessionId);
        server.close();
      });

      await server.connect(transport);
    } catch (error) {
      console.error("Error in SSE connection:", error);
      if (!res.headersSent) {
        res.status(500).send("SSE Connection Error");
      }
    }
  });

  app.post("/mcp/messages", async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      const transport = transports.get(sessionId);
      if (transport) {
        await transport.handlePostMessage(req, res);
      } else {
        res.status(400).send("Session expired or invalid");
      }
    } catch (error) {
      console.error("Error handling MCP message:", error);
      if (!res.headersSent) {
        res.status(500).send("Message Handling Error");
      }
    }
  });
}