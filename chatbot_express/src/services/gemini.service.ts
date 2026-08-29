import { GoogleGenAI } from "@google/genai";

type GeminiMcpTool = {
  type: "mcp_server";
  name: string;
  url: string;
};

type EmbeddingTask = "query" | "document";

const EMBEDDING_DIMS = Number(process.env.EMBEDDING_DIMS ?? "768");

// هذا هو "الدماغ" الذي يخبر المودل كيف يتصرف
const SYSTEM_INSTRUCTION = `
You are an AI assistant specialized in Docker technology.
You have access to the following tools:
 
TOOLS AVAILABLE:
- rag_search: Searches the internal Docker knowledge base stored in the database.
  Use it for questions about Docker concepts, commands, configurations, best practices, 
  troubleshooting, Docker Compose, images, containers, volumes, networks, etc.
 
DECISION RULES (follow in order):
1. If the question requires a specific action (create file, fetch data, etc.) → use the appropriate MCP tool.
2. If the question is about Docker or any topic stored in the knowledge base → use rag_search tool first.
3. If rag_search returns no useful results → answer from your own general knowledge.
4. If the question is completely unrelated to your tools → answer directly from your knowledge.
 
IMPORTANT:
- Never mention to the user that you used a tool or searched a database.
- Always respond in the same language the user used.
- Keep answers concise, clear, and helpful.
`;
 
class GeminiService {
  static #instance: GeminiService;
  #model: string;
  #genAI: GoogleGenAI;
  #mcpServerUrl: string;

  #getMcpServerUrl(): string {
    if (process.env.MCP_SERVER_URL) return process.env.MCP_SERVER_URL;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/mcp`;

    throw new Error("[GeminiService] MCP SERVER URL is not set. (e.g. https://your-app.vercel.app/mcp). ");
  }

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL;

    if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
    if (!model) throw new Error("GEMINI_MODEL is not set.");

    this.#model = model;
    this.#genAI = new GoogleGenAI({ apiKey });
    this.#mcpServerUrl = this.#getMcpServerUrl();
  }

  // هنا يتم انشاء الخدمة مرة واحدة فقط لعدم استهلاك الذاكرة
  public static getInstance(): GeminiService {
    if (!GeminiService.#instance) {
      GeminiService.#instance = new GeminiService();
    }
    return GeminiService.#instance;
  }

  async generateResponse(prompt: string, onChunk: (text: string) => void, onThemeChange: (theme: "light" | "dark" | "toggle") => void): Promise<string> {
    try {
      const stream = await this.#genAI.interactions.create({
        model: this.#model,
        system_instruction: SYSTEM_INSTRUCTION,
        input: prompt,
        tools: [
          {
            type: "mcp_server",
            // كلمة محجوزة - تخبر Gemini أن هذه الأداة هي MCP Server وليس function عادية
            // القيم الممكنة: "function" | "mcp_server" | "google_search" | "code_execution"

            name: "agent_docker", // اسم السيرفر
            url: this.#mcpServerUrl, // رابط السيرفر
          },
        ] satisfies GeminiMcpTool[],
        stream: true,
      });

      let fullText = "";
      for await (const event of stream) {
        if (event.event_type !== "step.delta") continue;
        // console.log("[RAW EVENT]", JSON.stringify(event));
        
        const delta = event.delta as any;
        // console.log("[Stream delta]", JSON.stringify(delta));

        // نص عادي من المودل
        if (delta?.type === "text" && typeof delta.text === "string") {
          onChunk(delta.text); // ← يُرسل للمتصفح فوراً بشكل اجزاء
          fullText += delta.text; // ← يُجمع النص كامل هنا
        }

        // استدعاء أداة تغيير ثيم الموقع
        if (delta?.type === "mcp_server_tool_call" && delta.name === "agent_docker:change_site_theme") {
          const theme = delta?.arguments?.theme;
          if (theme === "light" || theme === "dark" || theme === "toggle") {
            onThemeChange(theme);
          }
        }
      }

      if (!fullText) {
        console.warn("[GeminiService] Stream ended with no text output.");
      }

      //  يرجع النص الكامل بعد الانتهاء لغرض استخدامه لامور اخرى مثلا تخزينه في قاعدة البيانات
      // حاليا غير مستخدم بالمشروع فقط بالشرط اعلاه للتحقق من الحصول على رد
      return fullText;
    } catch (error) {
      console.error("[GeminiService] generateResponse failed:", JSON.stringify(error, null, 2));
      throw new Error(`Error generating response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Generate an embedding for the given text
  async generateEmbeddings(text: string, task: EmbeddingTask = "query", title?: string): Promise<number[]> {
    try {
      // نجهز النص حسب نوع المهمة
      const formattedText = task === "query" ? `task: search result | query: ${text}` : `title: ${title ?? "none"} | text: ${text}`;

      const response = await this.#genAI.models.embedContent({
        model: "gemini-embedding-2",
        contents: formattedText,
        config: {
          outputDimensionality: EMBEDDING_DIMS,
        },
      });

      const embedding = response.embeddings?.[0]?.values;

      if (!embedding) {
        throw new Error("[Gemini] No embeddings returned from API.");
      }

      if (embedding.length !== EMBEDDING_DIMS) {
        throw new Error(`[Gemini] Unexpected embedding size: got ${embedding.length}, expected ${EMBEDDING_DIMS}.`);
      }

      return embedding;
    } catch (error) {
      console.error("[Gemini] Error generating embedding:", error);
      throw new Error(`Error generating embedding: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const GEMINI = GeminiService.getInstance();
