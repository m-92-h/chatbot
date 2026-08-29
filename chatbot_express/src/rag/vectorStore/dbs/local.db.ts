import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

// ─── الأنواع ───────────────────────────────────────────────
interface LocalChunk {
  id: string;
  question: string;
  answer: string;
  embedding: number[];
}

interface LocalIndex {
  version: 1;
  items: LocalChunk[];
}

// الإعدادات
const DB_DIR  = path.resolve(process.env.LOCAL_DB_PATH ?? "./.local_vector_db");
const DB_FILE = path.join(DB_DIR, "index.json");

// cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += (a[i] ?? 0) * (b[i] ?? 0);
    normA += (a[i] ?? 0) ** 2;
    normB += (b[i] ?? 0) ** 2;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// قراءة وكتابة ملف الـ index 
async function readIndex(): Promise<LocalIndex> {
  if (!existsSync(DB_FILE)) return { version: 1, items: [] };
  const raw = await readFile(DB_FILE, "utf-8");
  return JSON.parse(raw) as LocalIndex;
}

async function writeIndex(index: LocalIndex): Promise<void> {
  await mkdir(DB_DIR, { recursive: true });
  await writeFile(DB_FILE, JSON.stringify(index), "utf-8");
}

// VectorStoreLocal
export class VectorStoreLocal {
  static #initialized = false;

  static async init(): Promise<void> {
    if (this.#initialized) return;
    this.#initialized = true;
    await mkdir(DB_DIR, { recursive: true });
    const index = await readIndex();
    console.log(`[local-db] Ready — ${index.items.length} chunks at: ${DB_FILE}`);
  }

  static async upsert(params: {
    id: string;
    question: string;
    answer: string;
    embedding: number[];
  }): Promise<void> {
    const index = await readIndex();

    // استبدل إذا كان الـ id موجوداً، وإلا أضف
    const existing = index.items.findIndex((item) => item.id === params.id);
    if (existing !== -1) {
      index.items[existing] = params;
    } else {
      index.items.push(params);
    }

    await writeIndex(index);
    console.log(`[local-db] Upserted id=${params.id} (total: ${index.items.length})`);
  }

  static async search(
    embedding: number[],
    topK: number = 5
  ): Promise<Array<{ id: string; question: string; answer: string; score: number }>> {
    const index = await readIndex();

    if (index.items.length === 0) return [];

    // cosine similarity
    return index.items
      .map((item) => ({
        id:       item.id,
        question: item.question,
        answer:   item.answer,
        score:    cosineSimilarity(embedding, item.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}