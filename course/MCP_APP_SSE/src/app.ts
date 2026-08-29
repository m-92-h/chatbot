import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { setupMcpRoutes } from "./mcp-server.js";
import { processUserMessage } from "./mcp-client.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.static("public"));

// 1. تسجيل مسارات الـ MCP أولاً (قبل استخدام express.json)
setupMcpRoutes(app);

// 2. تفعيل express.json للباقي من مسارات الـ API العادية
app.use(express.json());

// 3. مسار الشات الخاص بالواجهة
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  try {
    const result = await processUserMessage(message);
    res.json(result);
  } catch (error) {
    console.error("Error processing chat:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`App running at http://localhost:${PORT}`);
  console.log(`MCP SSE Endpoint: http://localhost:${PORT}/mcp/sse`);
});