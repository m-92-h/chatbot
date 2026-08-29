import { GoogleGenAI, mcpToTool } from "@google/genai";
import type { Client } from "@modelcontextprotocol/sdk/client";

class GeminiService {
  private static instance: GeminiService;
  private readonly modelName: string;
  private readonly genAI: GoogleGenAI;

  // التاكد من وجود المفتاح والمودل وانشاء اتصال بالمودل
  constructor(modelName: string = process.env.GEMINI_MODEL!) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("API key is required");
    }

    if (!modelName) {
      throw new Error("Model name is required");
    }

    this.modelName = modelName;
    this.genAI = new GoogleGenAI({ apiKey });
  }

  // ===============================================================================================
  // static نوعه instance عندما يتم انشاء اول نسخة تبقى محفوظة بنفس المودل ولا تتغير لان المتغير
  static getInstance(modelName?: string): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService(modelName);
    }
    return GeminiService.instance;
  }
  // ولجعل تغير المودل يكون ديناميكي يجب اضافة الدالة التالية
  /* 
  public getModel(customModel?: string) {
     const selectedModel = customModel || this.modelName;
     return this.#genAI.getGenerativeModel({ model: selectedModel });
   }
  */
  // ===============================================================================================
  
  //  RAG لتوليد رد عادي تبع نظام
  async generateResponse(prompt: string): Promise<string> {
    try {
      const response = await this.genAI.models.generateContent({
        model: this.modelName,
        contents: prompt,
        // config: {
        //   systemInstruction: "You are a cat. Your name is Neko.",
        //   thinkingConfig: {
        //     thinkingBudget: 0, // Disables thinking
        //   },
        // },
      });
      return response.text || "No response generated.";
    } catch (error: any) {
      console.error("Error generating response from GeminiProvider:", error);
      throw new Error(`Error generating response: ${error.message}`);
    }
  }

  // MCPتولد رد لاداوات ال
  async generateResponseWithTools(
    prompt: string,
    mcpClient: Client
  ): Promise<string> {
    try {
      const response = await this.genAI.models.generateContent({
        model: this.modelName,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        config: {
          systemInstruction: {
            role: "model",
            parts: [
              {
                text: `
                You are an AI assistant with access to internal tools.

                  TOOLS:
                  - RAG Search tool for knowledge-base, company information, policies, product details, and stored documents.
                  - Other internal tools provided to you.

                  BEHAVIOR RULES:
                  1. When a question is clearly related to stored documents, company information, product details, order/refund/shipping/support topics, or any knowledge-base content, try using the RAG Search tool first.
                  2. If the RAG tool returns no useful information, or the query is unrelated to stored documents, answer using your own general knowledge.
                  3. Use other tools only when they are clearly relevant to the user’s question.
                  4. If no tool is relevant, answer directly using your own reasoning.
                  5. Do not mention tool usage unless the user specifically asks.
                  6. Keep responses concise, accurate, and helpful.

                  Your goal is to provide the best possible answer, combining tools with your own knowledge when needed.

                `,
                // text: `
                //   You are an AI assistant that can answer questions using internal tools.

                //   TOOLS:
                //   - RAG Search tool for knowledge-base and product information
                //   -All Other Tools

                //   RULE:
                //   When a question relates to general company info, product info, help center topics, or refund/shipping/support policies, ALWAYS call the ragSearch tool.
                //   For any other domain, choose the most relevant tool.
                //   If no tool fits, answer with your own knowledge.

                //   Be concise and do not mention tool usage unless asked.
                // `,
                // text: "You are an AI assistant specialized in E-commerce data (orders and customers) and weather data too. When the user asks a question about orders or customers or weather information, use the provided tools. **If the question is unrelated to your tools, answer using your intrinsic knowledge.** Be concise and do not mention the tools were used unless asked.",
              },
            ],
          },
          tools: [mcpToTool(mcpClient)],
          // temperature: 0.2
        },
      });

      return this.extractResponseText(response);
    } catch (error: any) {
      console.error("Error generating response from GeminiProvider:", error);
      throw new Error(`Error generating response: ${error.message}`);
    }
  }

// دالة استخراج وتنسيق (Parser) لنتيجة الدالة generateResponseWithTools.
  extractResponseText(response: any): string {
    const candidate = response?.candidates?.[0];

    if (!candidate) return "";

    // step 1: Find the primary text part in the model's final response
    const textPart = candidate.content?.parts.find((p: any) => p.text);

    if (textPart && textPart.text) {
      return textPart.text.trim();
    }

    // step 2: Fallback for debugging (rarely happen with auto-tooling)
    const structuredPart = candidate.content?.parts.find(
      (p: any) => p.functionResponse?.response?.structuredContent
    );

    if (structuredPart) {
      // If the model gave NO text, but tool data exists, you can fall back to the data
      return (
        "Tool executed successfully, but no natural language summary was provided. Raw data:\n" +
        JSON.stringify(
          structuredPart.functionResponse.response.structuredContent,
          null,
          2
        )
      );
    }

    return "No valid response was generated.";
  }

  // تحويل النص الى متجهات
  async generateEmbeddings(
    data: string | string[],
    taskType = "RETRIEVAL_QUERY"
  ) {
    try {
      console.log("Generating embeddings...", data);
      const response = await this.genAI.models.embedContent({
        model: "gemini-embedding-001",
        contents: data,
        config: {
          taskType,
        },
      });

      const embeddings = response.embeddings!.map((e) => e.values);
      return embeddings;
    } catch (error: any) {
      console.error("Error generating embeddings:", error);
      throw new Error(`Error generating embeddings: ${error.message}`);
    }
  }
}

export const GEMINI = GeminiService.getInstance();
