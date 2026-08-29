import { Request, Response } from "express";
import { processUserMessage } from "../mcp/client/mcpClient.js";

export class ChatController {
  static async handleChat(req: Request, res: Response) {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required." });

    try {
      const result = await processUserMessage(message);
      return res.json(result);
    } catch (error) {
      console.error("Chat error:", error);
      return res.status(500).json({ error: (error as Error).message });
    }
  }
}