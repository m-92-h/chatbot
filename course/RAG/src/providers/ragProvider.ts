import fs from "node:fs";
import path from "node:path";
import GeminiProvider from "./geminiProvider.js";

interface KnowledgeItem {
  question: string;
  answer: string;
  sourceFile?: string;
}

interface CachedVector {
  item: KnowledgeItem;
  vector: number[];
}

// Config
const RAG_CONFIG = Object.freeze({
  TOP_K: 2,
  THRESHOLD: 0.55,
  VECTOR_STORE_PATH: path.join(process.cwd(), "data", "vectorStore.json"),
});

class RagProvider {
  readonly #gemini: GeminiProvider;
  #embeddingsCache: CachedVector[] = []; // for storage Embeddings
  #isInitialized: boolean = false; // for block re-generation of embeddings

  constructor(geminiProvider: GeminiProvider) {
    if (!geminiProvider) throw new Error("GeminiProvider instance is required.");
    this.#gemini = geminiProvider;
  }

  // Read The Vectors (Embeddings)
  async init(): Promise<void> {
    if (this.#isInitialized) return;

    if (!fs.existsSync(RAG_CONFIG.VECTOR_STORE_PATH)) {
      throw new Error("vectorStore.json not found! Please run 'npm run build:embeddings' first.");
    }

    try {
      const raw = fs.readFileSync(RAG_CONFIG.VECTOR_STORE_PATH, "utf-8");
      this.#embeddingsCache = JSON.parse(raw) as CachedVector[];
    } catch {
      throw new Error("vectorStore.json is corrupted or contains invalid JSON.");
    }

    this.#isInitialized = true;
    console.log(`⚡ RAG Provider initialized with ${this.#embeddingsCache.length} pre-computed items.`);
  }

  // حساب التشابه بين متجهين
  #cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Retrieval Step — جلب البيانات الأقرب للسؤال
  async #retrieveRelevantContext(query: string, topK: number = RAG_CONFIG.TOP_K, threshold: number = RAG_CONFIG.THRESHOLD): Promise<KnowledgeItem[]> {
    const queryVector = await this.#gemini.generateEmbedding(query);

    const scoredItems = this.#embeddingsCache.map((cached) => ({
      item: cached.item,
      similarity: this.#cosineSimilarity(queryVector, cached.vector),
    }));

    scoredItems.sort((a, b) => b.similarity - a.similarity);

    console.log(
      "Top Matches:",
      scoredItems.slice(0, topK).map((s) => ({ q: s.item.question, score: s.similarity.toFixed(3) })),
    );

    return scoredItems
      .filter((s) => s.similarity >= threshold)
      .slice(0, topK)
      .map((s) => s.item);
  }

  // (Semantic Search) تجهيز التعليمات المدعومة بالبحث الدلالي 
  async preparePrompt(query: string): Promise<string> {
    await this.init();
    const relevantItems = await this.#retrieveRelevantContext(query);

    // if length > 0 => return data in system, 
    // if else => return data from gemini
    if (relevantItems.length > 0) {
      const context = relevantItems.map((item) => `Q: ${item.question}\nA: ${item.answer}`).join("\n\n");

      return `You are a helpful assistant. Use the following relevant knowledge base context to answer the question. Give priority to this information.
              Knowledge Base Context: ${context} User Question: ${query} Answer:`;
    }

    return `You are a helpful and intelligent AI assistant. Answer the user's question accurately using your general knowledge.
            User Question: ${query} Answer:`;
  }
}

export default RagProvider;
