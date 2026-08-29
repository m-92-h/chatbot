import { Request, Response } from "express";
import GeminiProvider from "../providers/geminiProvider.js";
import RagProvider from "../providers/ragProvider.js";

// تم انشائهم خارج الدالة لتقليل استهلاك الذاكرة
const gemini = new GeminiProvider(process.env.GEMINI_API_KEY, process.env.GEMINI_MODEL);
const rag = new RagProvider(gemini);

export async function handleChat(req: Request, res: Response): Promise<void> {
  const { message } = req.body as { message?: string };

  if (!message || typeof message !== "string" || message.trim() === "") {
    res.status(400).json({ error: "Message is required." });
    return;
  }

  try {
    const prompt = await rag.preparePrompt(message.trim());
    console.log("Generated Prompt:\n", prompt);

    const reply = await gemini.generateResponse(prompt);
    console.log("Generated Reply:\n", reply);

    res.json({ reply });
  } catch (error) {
    console.error("Error processing message:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
