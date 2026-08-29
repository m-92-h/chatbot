import { GEMINI } from "../services/gemini.service.ts";
import { VectorStore } from "./vectorStore/vector.store.ts";

interface RagChunk {
  id: string;
  text: string;
  metadata: any;
  score: number | null;
}

// ================== ( ما يقوم به هذا الملف ) ===================
// معرفة قاعدة البيانات اولا ثم التحقق من انشاء الجدول 
// ثم نحول سؤال المستخدم الى متجه
// نجري عملية البحث الدلالي عن اقرب متجه
// =================================================================

// =========== ( ما يحدث بعد ارسال الرد من هذا الملف ) ===========
// سابقا mcp ثم يتم ارسال التعليمة والمصدر الى الاداة المبنية على سيرفر
// مع السيرفر يتم جلب الاداة المناسبة بشكل تلقائي من خلال استدعاء المودل لها  clientثم من خلال الاتصال ال
// حيث المودل قبل ان يرد على سؤال المستخدم يعرف بشكل تلقائي الاداة المناسبة للاستخدام
// =================================================================

export class RagEngine {
  static async buildPrompt(query: string, topK: number = 4) {
    try {
      const Store = VectorStore.get();
      await Store.init();
      console.log("RAG: Vector store initialized");

      console.log("RAG: Generating embeddings...");
      const [queryEmbedding] = await GEMINI.generateEmbeddings([query]);
      console.log("RAG: Embeddings value: ", queryEmbedding);

      if (!queryEmbedding) throw new Error("Failed to create embeddings");

      console.log("RAG: Embeddings generated");

      if (queryEmbedding?.length !== Number(process.env.EMBEDDING_DIMS)) {
        throw new Error(
          `Embedding dimension mismatch. Gemini returned ${queryEmbedding.length} dims, ` +
            `but EMBEDDING_DIMS env is set to ${process.env.EMBEDDING_DIMS}.`
        );
      }

      console.log("RAG: Searching vector DB...");
      const results = await Store.search(queryEmbedding, topK);

      if (!results?.length) {
        return {
          prompt: `No matching documents found for query: ${query}`,
          sources: [],
        };
      }

      /* Build Concext
      SOURCE 1:
      <chunk text>
      META: { ...metadata JSON... }
      */
      const context = results
        .map(
          (r: RagChunk, i: number) =>
            `SOURCE ${i + 1}:\n${r.text}\nMETA: ${JSON.stringify(r.metadata)}`
        )
        .join("\n\n");

      const prompt = `
      You are an assistant that answers questions only using the information in the context.
      If the answer is not present, reply: "I don't have enough information."

      CONTEXT:
      ${context}

      QUESTION:
      ${query}

      ANSWER:
      `;

      return { prompt, sources: results };
    } catch (error) {
      console.error("RAG PIPELINE ERROR:", error);
      throw error;
    }
  }
}
