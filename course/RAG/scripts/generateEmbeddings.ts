import fs from "node:fs";
import path from "node:path";
import GeminiProvider from "../src/providers/geminiProvider.js";

// ============================================================
// Types
// ============================================================

interface KnowledgeItem {
  question: string;
  answer: string;
}

interface VectorStoreEntry {
  item: KnowledgeItem & { sourceFile: string };
  vector: number[];
}

// ============================================================
// Build Vector Store
// ============================================================

async function buildVectorStore(): Promise<void> {
  console.log("🚀 Starting Vector Store Generation...");

  const gemini = new GeminiProvider(process.env.GEMINI_API_KEY, process.env.GEMINI_MODEL);

  const dataDir = path.join(process.cwd(), "data");
  const outputFile = path.join(dataDir, "vectorStore.json");

  // قراءة جميع ملفات JSON في مجلد data عدا vectorStore.json
  const files = fs.readdirSync(dataDir).filter((file) => file.endsWith(".json") && file !== "vectorStore.json");

  if (files.length === 0) {
    console.warn("⚠️ No JSON data files found in /data folder.");
    return;
  }

  const vectorStore: VectorStoreEntry[] = [];

  for (const file of files) {
    const filePath = path.join(dataDir, file);

    let content: KnowledgeItem[];

    try {
      content = JSON.parse(fs.readFileSync(filePath, "utf-8")) as KnowledgeItem[];
    } catch {
      console.error(`❌ Failed to parse ${file} — skipping.`);
      continue;
    }

    console.log(`📂 Processing: ${file} (${content.length} items)`);

    for (const item of content) {
      if (!item.question || !item.answer) {
        console.warn(`⚠️ Skipping invalid item in ${file}:`, item);
        continue;
      }

      const textToEmbed = `Question: ${item.question} Answer: ${item.answer}`;
      const vector = await gemini.generateEmbedding(textToEmbed);

      vectorStore.push({
        item: { ...item, sourceFile: file },
        vector,
      });
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(vectorStore, null, 2), "utf-8");
  console.log(`✅ Done! Vector store generated with ${vectorStore.length} items → ${outputFile}`);
}

buildVectorStore().catch((error) => {
  console.error("❌ Fatal error during embedding generation:", error);
  process.exit(1);
});
