import { prisma } from "@/lib/prisma";

export interface ChunkUpsertParams {
  id: string;
  question: string;
  answer: string;
  embedding: number[];
}

export interface ChunkSearchResult {
  id: string;
  question: string;
  answer: string;
  score: number;
}

const DIMS = Number(process.env.EMBEDDING_DIMS ?? 768);

export class VectorStorePg {
  static #initialized = false;

  static async init(): Promise<void> {
    if (this.#initialized) return;
    this.#initialized = true;

    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS "vector"`);
    console.log(`[pgvector] VectorStore ready — table: document_chunks, dims: ${DIMS}`);
  }

  static async upsert(params: ChunkUpsertParams): Promise<void> {
    const { id, question, answer, embedding } = params;

    if (embedding.length !== DIMS) {
      throw new Error(`[pgvector] Embedding dimension mismatch: expected ${DIMS}, got ${embedding.length}.`);
    }

    const vectorLiteral = `[${embedding.join(",")}]`;

    await prisma.$executeRaw`
      INSERT INTO document_chunks (id, question, answer, embedding, "createdAt")
      VALUES (
        ${id},
        ${question},
        ${answer},
        ${vectorLiteral}::vector,
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        question  = EXCLUDED.question,
        answer    = EXCLUDED.answer,
        embedding = EXCLUDED.embedding
    `;

    console.log(`[pgvector] Upserted chunk id=${id}`);
  }

  static async search(queryEmbedding: number[], topK: number = 5): Promise<ChunkSearchResult[]> {
    if (queryEmbedding.length !== DIMS) {
      throw new Error(`[pgvector] Query embedding dimension mismatch: expected ${DIMS}, got ${queryEmbedding.length}.`);
    }

    const vectorLiteral = `[${queryEmbedding.join(",")}]`;

    const rows = await prisma.$queryRaw<Array<{ id: string; question: string; answer: string; distance: number }>>`
      SELECT
        id,
        question,
        answer,
        embedding <=> ${vectorLiteral}::vector AS distance
      FROM document_chunks
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT ${topK}
    `;

    return rows.map((row) => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
      score: 1 - Number(row.distance),
    }));
  }
}
