import { VectorStorePg } from "./dbs/pgvector.db.js";
import { VectorStoreLocal } from "./dbs/local.db.js";

export interface IVectorStore {
  init(): Promise<void>;
  upsert(params: { id: string; question: string; answer: string; embedding: number[] }): Promise<void>;
  search(
    embedding: number[],
    topK: number,
  ): Promise<
    Array<{
      id: string;
      question: string;
      answer: string;
      score: number;
    }>
  >;
}

export class VectorStore {
  static get(): IVectorStore {
    const backend = process.env.VECTOR_DB ?? "local";

    if (backend === "pgvector") return VectorStorePg;
    if (backend === "local") return VectorStoreLocal;

    throw new Error(`[VectorStore] Invalid VECTOR_DB value: "${backend}". Use "pgvector" or "local".`);
  }
}
