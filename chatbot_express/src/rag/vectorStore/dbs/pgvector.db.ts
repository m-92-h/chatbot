import { prisma } from "../../../lib/prisma.js";

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

const DIMS = Number(process.env.EMBEDDING_DIMS ?? 768); // gemini-embedding-2 fixed output dimension

export class VectorStorePg {
  static #initialized = false;

  // ملاحظة: في بريزما لا يتم انشاء الجداول من هنا وانما عبر الاوامر الخاصة بها
  // تستخدم هذه الدالة فقط لغرض التاكد من انشاء الجداول
  static async init(): Promise<void> {
    if (this.#initialized) return;
    this.#initialized = true;

    await prisma.$executeRawUnsafe(
      `CREATE EXTENSION IF NOT EXISTS "vector"`
    );

    console.log(`[pgvector] VectorStore ready — table: document_chunks, dims: ${DIMS}`);
  }

  // تستخدم هذه الدالة فقط في السكربت لاضافة البيانات مع المتجه الخاص بها الى قاعدة البيانات
  static async upsert(params: ChunkUpsertParams): Promise<void> {
    const { id, question, answer, embedding } = params;

    if (embedding.length !== DIMS) {
      throw new Error(
        `[pgvector] Embedding dimension mismatch: expected ${DIMS}, got ${embedding.length}. ` +
        `Check that you are using gemini-embedding-2.`
      );
    }

    // نحوّل المصفوفة إلى صيغة pgvector النصية: [0.1,0.2,...]
    // لان pgvector لا يفهم مصفوفات JavaScript فيقوم بتحويلها لنص وبالتنسيف المحدد لغرض اتمام المقارنة بشكل ناجح
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

  // تستخدم هذه الدالة فقط لمقارنة سؤال المستخدم مع البيانات المخزنة
  // علما ان البيانات ترسل بشكل متجهات لتتم المقارنة
  // cosine distance
  static async search(
    queryEmbedding: number[],
    topK: number = 5
  ): Promise<ChunkSearchResult[]> {
    if (queryEmbedding.length !== DIMS) {
      throw new Error(
        `[pgvector] Query embedding dimension mismatch: expected ${DIMS}, got ${queryEmbedding.length}.`
      );
    }

    const vectorLiteral = `[${queryEmbedding.join(",")}]`;

    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        question: string;
        answer: string;
        distance: number;
      }>
    >`
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