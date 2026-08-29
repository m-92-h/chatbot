import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { GoogleGenAI, FunctionDeclaration } from "@google/genai";
import dotenv from "dotenv";

// تحميل متغيرات البيئة احتياطياً داخل هذا الملف
dotenv.config();

export async function processUserMessage(userMessage: string) {
  // 1. التحقق وتهيئة الذكاء الاصطناعي داخل الدالة
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Make sure it is defined in your .env file.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";

  // 2. الاتصال بسيرفر الـ MCP المحلي
  const transport = new SSEClientTransport(new URL("http://localhost:3000/mcp/sse"));
  const mcpClient = new Client({ name: "web-client", version: "1.0.0" }, { capabilities: {} });

  await mcpClient.connect(transport);

  try {
    // 3. جلب الأدوات المتاحة تلقائياً من سيرفر MCP
    const { tools } = await mcpClient.listTools();

    const formattedTools: FunctionDeclaration[] = tools.map((t) => ({
      name: t.name,
      description: t.description ?? "",
      parameters: t.inputSchema as unknown as FunctionDeclaration["parameters"],
    }));

    // 4. إرسال الطلب لـ Gemini
    const response = await ai.models.generateContent({
      model: modelName,
      contents: userMessage,
      config: {
        tools: [{ functionDeclarations: formattedTools }],
      },
    });

    const functionCalls = response.functionCalls;

    // 5. إذا طلب النموذج أداة، نفذها عبر MCP وارجع النتيجة
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];

      if (!call.name) {
        throw new Error("Function call returned from Gemini missing a name.");
      }

      const toolName: string = call.name;
      const toolArgs = (call.args as Record<string, any>) ?? {};

      const toolResult = await mcpClient.callTool({
        name: toolName,
        arguments: toolArgs,
      });

      const candidateContent = response.candidates?.[0]?.content;
      if (!candidateContent || !candidateContent.parts) {
        throw new Error("Model response candidates or parts are undefined.");
      }

      const finalResponse = await ai.models.generateContent({
        model: modelName,
        contents: [
          { role: "user", parts: [{ text: userMessage }] },
          { role: "model", parts: candidateContent.parts },
          {
            role: "user",
            parts: [
              {
                functionResponse: {
                  name: toolName,
                  response: { result: toolResult.content },
                },
              },
            ],
          },
        ],
      });

      return {
        reply: finalResponse.text ?? "No response text generated.",
        toolUsed: toolName,
        toolArgs: toolArgs,
        toolOutput: toolResult.content,
      };
    }

    return {
      reply: response.text ?? "No response text generated.",
      toolUsed: null,
    };
  } finally {
    await mcpClient.close();
  }
}