/* seed.ts — يقرأ ملفات البيانات من src/data/ ويُخزّنها مع embeddings في DB */

import { VectorStore } from "@/lib/rag/vectorStore/vector.store";
import { GEMINI } from "@/lib/service/gemini.service";
import { randomUUID } from "node:crypto";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export interface DockerChunk {
  question: string;
  answer: string;
}

export async function ingestFile(filePath: string): Promise<void> {
  const Store = VectorStore.get();
  await Store.init();

  const absolutePath = path.resolve(filePath);
  const fileUrl = pathToFileURL(absolutePath).href;

  console.log(`[seed] Loading data file: ${absolutePath}`);

  // dynamic import يعمل مع .ts عبر tsx
  const module = (await import(fileUrl)) as {
    default?: DockerChunk[];
    data?: DockerChunk[];
  };
  const chunks: DockerChunk[] = module.default ?? module.data ?? [];

  if (!Array.isArray(chunks)) {
    throw new Error(`[seed] Expected an array of { question, answer }. ` + `Make sure the file exports: export default [...] or export const data = [...]`);
  }

  console.log(`[seed] Found ${chunks.length} Q&A pairs. Starting ingestion...`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!;

    if (!chunk.question?.trim() || !chunk.answer?.trim()) {
      console.warn(`[seed] Skipping chunk #${i} — missing question or answer`);
      failed++;
      continue;
    }

    try {
      const textToEmbed = `Question: ${chunk.question}\nAnswer: ${chunk.answer}`;
      const embedding = await GEMINI.generateEmbeddings(textToEmbed, "document", chunk.question);

      await Store.upsert({
        id: randomUUID(),
        question: chunk.question,
        answer: chunk.answer,
        embedding,
      });

      console.log(`[seed] ✓ (${i + 1}/${chunks.length}) ${chunk.question.slice(0, 60)}...`);
      success++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[seed] ✗ (${i + 1}/${chunks.length}) FAILED: ${msg}`);
      failed++;
    }
  }

  console.log(`\n[seed] Done. ✓ ${success} succeeded, ✗ ${failed} failed.`);
}

if (process.argv[1] && import.meta.url.includes(path.basename(process.argv[1], ".ts"))) {
  const dataDir = path.resolve("src/data");
  const files = await readdir(dataDir);
  const dataFiles = files.filter((f) => f.endsWith(".ts") || f.endsWith(".js") || f.endsWith(".json"));

  if (dataFiles.length === 0) {
    console.error(`[seed] No data files found in ${dataDir}`);
    process.exit(1);
  }

  console.log(`[seed] Found ${dataFiles.length} file(s): ${dataFiles.join(", ")}`);

  let totalSuccess = 0;
  let totalFailed = 0;

  for (const file of dataFiles) {
    const filePath = path.join(dataDir, file);
    console.log(`\n[seed] ===== Processing: ${file} =====`);
    try {
      await ingestFile(filePath);
      totalSuccess++;
    } catch (err) {
      console.error(`[seed] Fatal error in ${file}:`, err);
      totalFailed++;
    }
  }

  console.log(`\n[ingest] All files processed. ✓ ${totalSuccess} succeeded, ✗ ${totalFailed} failed.`);
}
