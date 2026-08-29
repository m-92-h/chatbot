import type { Request, Response } from "express";
import { GEMINI } from "../services/gemini.service.ts";
import { MCPClient } from "../mcp/client/mcp-client.service.ts";
import { OPENAI } from "../services/openai.service.ts";

export class AgentController {
  static async chat(req: Request, res: Response) {
    const { message, model } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const selectedModel = model || "gemini";

    try {
      const mcp = await MCPClient.init();

      const LLM = selectedModel === "gemini" ? GEMINI : OPENAI;

      const response = await LLM.generateResponseWithTools(message, mcp.client);
      res.json({ reply: response });


      // if (selectedModel === "gemini") {
      //   const mcp = await MCPClient.init();
      //   const response = await GEMINI.generateResponseWithTools(
      //     message,
      //     mcp.client
      //   );
      //   res.json({ reply: response });
      // }

      // if (selectedModel === "gpt") {
      //   // model calling
      //   // const tools = await MCPClient.getTools();
      // }
    } catch (error) {
      console.error("Invalid model:", error);
      res.status(500).json({ error: "Failed to get a response from the AI." });
    }
  }
}
