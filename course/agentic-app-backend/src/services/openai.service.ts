import OpenAI from "openai";
import type { Client } from "@modelcontextprotocol/sdk/client";
import { zodTextFormat } from "openai/helpers/zod.mjs";
import { z } from "zod";

// JSON PRIMITIVES (OpenAI + MCP SAFE)
const JsonPrimitive = z.union([z.string(), z.number(), z.boolean(), z.null()]);

/**
 * TOOL ARGUMENTS
   - MUST be an object for MCP
   - No `any`, no optional
 */
const ToolArgumentSchema = z.record(JsonPrimitive);

/**
 * FINAL INTENT SCHEMA
   - Root object
   - All fields required
   - Nullable used correctly
 */
const ToolIntentSchema = z
  .object({
    action: z.enum(["final", "tool"]),
    tool: z.string().nullable(),
    arguments: ToolArgumentSchema.nullable(),
    output: z.string().nullable(),
  })
  .refine(
    (v) =>
      (v.action === "tool" && v.tool !== null && v.arguments !== null) ||
      (v.action === "final" && v.output !== null),
    {
      message: "Invalid Intent Shape",
    }
  );

class OpenaiService {
  private static instance: OpenaiService;
  private readonly modelName: string;
  private readonly openAI: OpenAI;
  private readonly MAX_STEPS = 6;

  constructor(modelName: string = process.env.OPENAI_MODEL || "gpt-5-nano") {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("API key is required");
    }

    if (!modelName) {
      throw new Error("Model name is required");
    }

    this.modelName = modelName;
    console.log(this.modelName);
    this.openAI = new OpenAI({ apiKey });
  }

  static getInstance(modelName?: string): OpenaiService {
    if (!this.instance) {
      this.instance = new OpenaiService(modelName);
    }
    return this.instance;
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const response = await this.openAI.responses.create({
        model: this.modelName,
        input: prompt,
      });
      return response.output_text || "No response generated.";
    } catch (error: any) {
      console.error("Error generating response from OpenaiProvider:", error);
      throw new Error(`Error generating response: ${error.message}`);
    }
  }

  async generateEmbeddings(data: string | string[]) {
    try {
      const response = await this.openAI.embeddings.create({
        model: "text-embedding-3-small",
        input: data,
        encoding_format: "float",
      });

      const embeddings = response.data.map((e) => e.embedding);
      return embeddings;
    } catch (error: any) {
      console.error("Error generating embeddings:", error);
      throw new Error(`Error generating embeddings: ${error.message}`);
    }
  }

  async generateResponseWithTools(
    prompt: string,
    mcpClient: Client
  ): Promise<string> {
    const mcpTools = await mcpClient.listTools();

    const toolContext = mcpTools.tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
      outputSchema: t.outputSchema,
    }));

    const systemIntruction = `
   You are an AI assistant with access to internal tools via MCP.

   Use ragSearch FIRST for refunds, policies, documentation, or help queries.
   Use other tools only when clearly relevant.
   If no tool is required, answer directly.

   Do NOT mention tool usage unless asked.
   Keep responses concise and helpful.
   `;

    //  hard response contract
    const responseContract = `
   You MUST ALWAYS respond in valid JSON.


    If NO tool is required:
    {
      "action": "final",
      "tool": null,
      "arguments": null,
      "output": "<response>"
    }

    If a tool IS required:
    {
      "action": "tool",
      "tool": "<tool_name>",
      "arguments": {
        // tool-specific arguments here
      },
      "output": null
    }

    NEVER respond with plain text.
   `;

    //  message state
    let messages: any[] = [
      { role: "developer", content: systemIntruction },
      { role: "developer", content: responseContract },
      {
        role: "developer",
        content: `Available tools: ${JSON.stringify(toolContext, null, 2)}`,
      },
      { role: "user", content: prompt },
    ];

    // agent loop
    for (let step = 0; step < this.MAX_STEPS; step++) {
      let intent;

      try {
        const response = await this.openAI.responses.parse({
          model: this.modelName,
          input: messages,
          text: {
            format: zodTextFormat(ToolIntentSchema, "intent"),
          },
        });

        if (!response.output_parsed) {
          throw new Error("No parsed output intent returned from OpenAI");
        }

        intent = response.output_parsed;
      } catch (error: any) {
        console.error("OpenAI parse failure:", error);
        return "Sorry, I couldn’t process that properly. Please try again.";
      }

      // tool execution
      if (intent.action === "tool") {
        const result = await mcpClient.callTool({
          name: intent.tool!,
          arguments: intent.arguments!,
        });

        messages.push({
          role: "assistant",
          content: JSON.stringify(intent),
        });

        messages.push({
          role: "developer",
          content: `
            MCP tool "${intent.tool}" executed.

            Structured Output:
            ${JSON.stringify(result.structuredContent, null, 2)}
          `,
        });

        continue;
      }

      // final answer
      if (intent.action === "final") {
        return intent.output!;
      }
    }

    throw new Error("Agent exceeded maximum reasoning steps");
  }
}

export const OPENAI = OpenaiService.getInstance();
