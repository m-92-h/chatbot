import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { RagEngine } from "../../../rag/ragEngine.ts";

export function registerRagTool(mcpServer: McpServer) {
  console.log("Registering RAG Tool...");

  mcpServer.registerTool(
    "ragSearch",
    {
      title: "RAG Search",
      description:
        "Retrieve relevant context from vector store for a user query",
      inputSchema: {
        query: z.string(),
        topK: z.number().optional(),
      },
      outputSchema: {
        prompt: z.string(), // RAG prompt for LLM to continue
        sources: z.any(), // Metadata + chunks
      },
    },
    async ({ query, topK }) => {
      // topK means: the number of most relevant chunks you want to retrieve from the vector database. (nearest ones)

      console.log("rag query: ", query);

      try {
        const result = await RagEngine.buildPrompt(query, topK);

        return {
          content: [{ type: "text", text: result.prompt }],
          structuredContent: { prompt: result.prompt, sources: result.sources },
        };
      } catch (error: any) {
        console.error("RAG TOOL ERROR:", error);
        return {
          content: [{ type: "text", text: "RAG ERROR: " + error.message }],
          structuredContent: {
            prompt: JSON.stringify(error.message),
            sources: [],
          },
        };
      }
    }
  );
}
