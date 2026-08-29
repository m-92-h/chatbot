import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RagEngine } from "@/lib/rag/ragEngine";

export function registerRagTool(server: McpServer): void {
  console.log("[MCP] Registering rag_search tool...");

  server.registerTool(
    "rag_search",
    {
      title: "RAG Search",
      description:
        "Search the Docker knowledge base for relevant Q&A pairs. " +
        "Use this tool for ANY question about Docker: concepts, CLI commands, " +
        "Docker Compose, images, containers, volumes, networks, Dockerfile syntax, " +
        "networking, troubleshooting, security, or best practices.",
      inputSchema: {
        query: z.string().describe("The user question or search phrase to look up in the knowledge base."),
        topK: z.number().int().min(1).max(20).optional().describe("Number of most-relevant Q&A pairs to retrieve (default: 5)."),
      },
      outputSchema: {
        prompt: z.string().describe("Augmented prompt with retrieved context ready for the model."),
        sources: z
          .array(
            z.object({
              id: z.string(),
              question: z.string(),
              answer: z.string(),
              score: z.number().describe("Similarity score (0–1). Higher = more relevant."),
            }),
          )
          .describe("Retrieved Q&A pairs used to build the context."),
      },
    },
    async ({ query, topK }) => {
      console.log(`[rag_search] query="${query}" topK=${topK ?? 5}`);

      try {
        const result = await RagEngine.buildPrompt(query, topK ?? 5);

        return {
          content: [{ type: "text" as const, text: result.prompt }],
          structuredContent: {
            prompt: result.prompt,
            sources: result.sources,
          },
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[rag_search] ERROR:", message);

        return {
          content: [
            {
              type: "text" as const,
              text: `RAG search failed: ${message}. ` + `Please answer the user's question using your general knowledge.`,
            },
          ],
          structuredContent: { prompt: "", sources: [] },
          isError: true,
        };
      }
    },
  );
}
