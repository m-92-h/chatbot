/*
 * ingest.ts — يقرأ ملفات البيانات بصيغة Q&A ويخزنها مع متجهاتها في DB
 *
 * صيغة ملف البيانات المتوقعة (TypeScript أو JSON):
 *
 * export const data: DockerChunk[] = [
 *   { question: "...", answer: "..." },
 *   ...
 * ]
 *
 * تشغيل:
 *   npm run ingest
 */

import { VectorStore } from "./vectorStore/vector.store.js";
import { GEMINI } from "../services/gemini.service.js";
import { randomUUID } from "node:crypto";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export interface DockerChunk {
  question: string;
  answer: string;
}

// قراءة الملف وتقسيمه بشكل مقاطع وتحويله الى متجهات وارساله الى قاعة البيانات المختارة لتخزينه
export async function ingestFile(filePath: string): Promise<void> {
  const Store = VectorStore.get();
  await Store.init();

  const absolutePath = path.resolve(filePath);
  const fileUrl = pathToFileURL(absolutePath).href;

  console.log(`[ingest] Loading data file: ${absolutePath}`);

  const module = await import(fileUrl);
  const chunks: DockerChunk[] = module.default ?? module.data;

  if (!Array.isArray(chunks)) {
    throw new Error(
      `[ingest] Expected an array of { question, answer } objects. ` +
        `Make sure the file exports: export default [...] or export const data = [...]`
    );
  }

  console.log(`[ingest] Found ${chunks.length} Q&A pairs. Starting ingestion...`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!;

    if (!chunk.question?.trim() || !chunk.answer?.trim()) {
      console.warn(`[ingest] Skipping chunk #${i} — missing question or answer`);
      failed++;
      continue;
    }

    try {
      
      // =========================================================
      // نحوّل النص المُراد تخزينه إلى متجه
      // نمرر العنوان (السؤال) كـ title لتحسين جودة الـ embedding
      // =========================================================
      const textToEmbed = `Question: ${chunk.question}\nAnswer: ${chunk.answer}`;

      const embedding = await GEMINI.generateEmbeddings(textToEmbed, "document", chunk.question);

      await Store.upsert({
        id: randomUUID(),
        question: chunk.question,
        answer: chunk.answer,
        embedding,
      });

      console.log(`[ingest] ✓ (${i + 1}/${chunks.length}) ${chunk.question.slice(0, 60)}...`);
      success++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[ingest] ✗ (${i + 1}/${chunks.length}) FAILED: ${msg}`);
      failed++;
    }
  }

  console.log(`\n[ingest] Done. ✓ ${success} succeeded, ✗ ${failed} failed.`);
}

// ============================================================
// تشغيل مباشر: npm run ingest
// يقرأ جميع الملفات في src/data/ تلقائياً
// ============================================================
if (process.argv[1] && import.meta.url.includes(path.basename(process.argv[1], ".ts"))) {
  const dataDir = path.resolve("src/data");

  const files = await readdir(dataDir);
  const dataFiles = files.filter((f) => f.endsWith(".ts") || f.endsWith(".js") || f.endsWith(".json"));

  if (dataFiles.length === 0) {
    console.error(`[ingest] No data files found in ${dataDir}`);
    process.exit(1);
  }

  console.log(`[ingest] Found ${dataFiles.length} file(s): ${dataFiles.join(", ")}`);

  let totalSuccess = 0;
  let totalFailed = 0;

  for (const file of dataFiles) {
    const filePath = path.join(dataDir, file);
    console.log(`\n[ingest] ===== Processing: ${file} =====`);
    try {
      await ingestFile(filePath);
      totalSuccess++;
    } catch (err) {
      console.error(`[ingest] Fatal error in ${file}:`, err);
      totalFailed++;
    }
  }

  console.log(`\n[ingest] All files processed. ✓ ${totalSuccess} succeeded, ✗ ${totalFailed} failed.`);
}
