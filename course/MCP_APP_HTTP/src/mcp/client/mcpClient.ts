import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { GoogleGenAI, FunctionDeclaration } from "@google/genai";

export async function processUserMessage(userMessage: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing.");

  const ai = new GoogleGenAI({ apiKey });
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  //  الاتصال بسيرفر الـ MCP المحلي
  const transport = new StreamableHTTPClientTransport(new URL("http://localhost:3000/mcp"));
  const mcpClient = new Client({ name: "web-client", version: "1.0.0" }, { capabilities: {} });

  await mcpClient.connect(transport);

  try {
    //  جلب الأدوات المتاحة تلقائياً من سيرفر MCP
    const { tools } = await mcpClient.listTools();

    const formattedTools: FunctionDeclaration[] = tools.map((t) => ({
      name: t.name,
      description: t.description ?? "",
      parameters: t.inputSchema as unknown as FunctionDeclaration["parameters"],
    }));

    //  إرسال الطلب لـ Gemini
    const response = await ai.models.generateContent({
      model: modelName,
      contents: userMessage,
      config: { tools: [{ functionDeclarations: formattedTools }] },
    });

    const functionCalls = response.functionCalls;

    //  إذا طلب النموذج أداة، نفذها عبر MCP وارجع النتيجة
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (!call.name) throw new Error("Function call missing name.");

      const toolName = call.name;
      const toolArgs = (call.args as Record<string, unknown>) ?? {};

      const toolResult = await mcpClient.callTool({
        name: toolName,
        arguments: toolArgs,
      });

      const candidateContent = response.candidates?.[0]?.content;
      if (!candidateContent?.parts) throw new Error("Model response parts undefined.");

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
        reply: finalResponse.text ?? "No response generated.",
        toolUsed: toolName,
        toolArgs: toolArgs,
        toolOutput: toolResult.content,
      };
    }

    return { reply: response.text ?? "No response generated.", toolUsed: null };
  } finally {
    await mcpClient.close();
  }
}
