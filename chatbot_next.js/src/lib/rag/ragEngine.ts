import { GEMINI } from "@/lib/service/gemini.service";
import { VectorStore } from "@/lib/rag/vectorStore/vector.store";
import type { ChunkSearchResult } from "@/lib/rag/vectorStore/dbs/pgvector.db";

export interface RagResult {
  prompt: string;
  sources: ChunkSearchResult[];
}

export class RagEngine {
  static async buildPrompt(query: string, topK: number = 5): Promise<RagResult> {
    try {
      const Store = VectorStore.get();
      await Store.init();

      console.log("[RAG] Generating query embedding...");
      const queryEmbedding = await GEMINI.generateEmbeddings(query, "query");

      if (!queryEmbedding?.length) {
        throw new Error("[RAG] Failed to generate query embedding.");
      }

      console.log("[RAG] Searching vector store...");
      const results: ChunkSearchResult[] = await Store.search(queryEmbedding, topK);

      if (!results.length) {
        return {
          prompt: `No relevant context found for: "${query}"`,
          sources: [],
        };
      }

      const context = results.map((chunk, i) => `[Source ${i + 1}]\nQ: ${chunk.question}\nA: ${chunk.answer}`).join("\n\n---\n\n");

      const prompt = `
You are a Docker expert assistant. Answer ONLY using the provided context.
If the answer is not present in the context, say: "I don't have enough information about that."

CONTEXT:
${context}

USER QUESTION:
${query}

ANSWER:`.trim();

      console.log(`[RAG] Built prompt with ${results.length} sources.`);

      return { prompt, sources: results };
    } catch (error) {
      console.error("[RAG] Pipeline error:", error);
      throw error;
    }
  }
}
