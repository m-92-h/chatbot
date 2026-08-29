# 🐳 Agent Docker — Chatbot ذكي متخصص في Docker

مساعد ذكي متخصص في Docker مبني على **Google Gemini** مع نظام **RAG** (Retrieval-Augmented Generation) لتوفير إجابات دقيقة من قاعدة معرفة داخلية. يدعم الـ Streaming عبر SSE ويتكامل مع بروتوكول MCP لتوسيع قدراته.

---

## 📋 جدول المحتويات

- [نظرة عامة على المعمارية](#-نظرة-عامة-على-المعمارية)
- [بنية المشروع](#-بنية-المشروع)
- [متطلبات التشغيل](#-متطلبات-التشغيل)
- [إعداد المشروع](#-إعداد-المشروع)
- [متغيرات البيئة](#-متغيرات-البيئة)
- [قواعد البيانات المدعومة](#-قواعد-البيانات-المدعومة)
- [تشغيل المشروع](#-تشغيل-المشروع)
- [إدخال البيانات (Seeding)](#-إدخال-البيانات-seeding)
- [نقاط النهاية (API Endpoints)](#-نقاط-النهاية-api-endpoints)
- [MCP Tools المتاحة](#-mcp-tools-المتاحة)
- [واجهة المستخدم](#-واجهة-المستخدم)
- [البناء للإنتاج](#-البناء-للإنتاج)
- [مسار الطلب الكامل](#-مسار-الطلب-الكامل)

---

## 🏗 نظرة عامة على المعمارية

```
المستخدم (Browser)
     │  POST /api/chat  (SSE Stream)
     ▼
┌─────────────────┐
│  Express Server │  ← server.ts
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GeminiService  │  ← gemini.service.ts
│  (Streaming AI) │
└────────┬────────┘
         │  يستدعي MCP tools
         ▼
┌─────────────────┐
│   MCP Server    │  ← mcp/mcpServer.ts
│  /mcp endpoint  │
└────┬────────────┘
     │
     ├──► rag_search tool  →  RagEngine  →  VectorStore  →  DB
     │
     └──► change_site_theme tool  →  SSE event للمتصفح
```

النظام يعتمد على **ثلاث طبقات** رئيسية:

1. **طبقة الواجهة**: صفحة HTML/CSS/JS تتواصل مع الخادم عبر SSE
2. **طبقة الذكاء الاصطناعي**: Gemini يُدير الحوار ويستدعي الأدوات عبر MCP
3. **طبقة البيانات**: RAG Engine يبحث في قاعدة المتجهات ويُعيد السياق المناسب

---

## 📁 بنية المشروع

```
agent_docker/
├── src/
│   ├── server.ts                    # نقطة الدخول — Express app وSSE endpoint
│   ├── services/
│   │   └── gemini.service.ts        # تكامل Gemini API مع MCP و Streaming
│   ├── mcp/
│   │   ├── mcpServer.ts             # MCP Server Handler — يُسجّل الأدوات
│   │   └── tools/
│   │       ├── rag.tool.ts          # أداة البحث في قاعدة المعرفة
│   │       └── theme.tool.ts        # أداة تغيير ثيم الموقع
│   ├── rag/
│   │   ├── ragEngine.ts             # محرك RAG — يبني الـ Prompt المُعزَّز
│   │   ├── seed.ts                  # سكريبت إدخال البيانات
│   │   └── vectorStore/
│   │       ├── vector.store.ts      # Factory لاختيار قاعدة البيانات
│   │       └── dbs/
│   │           ├── pgvector.db.ts   # تنفيذ pgvector (PostgreSQL)
│   │           └── local.db.ts      # تنفيذ محلي بـ JSON
│   ├── lib/
│   │   └── prisma.ts                # Prisma Client مع PgAdapter
│   ├── data/
│   │   └── docker.ts                # بيانات Q&A الخاصة بـ Docker (30+ سؤال)
│   └── generated/
│       └── prisma/                  # Prisma Client المُوَلَّد
├── prisma/
│   ├── schema.prisma                # تعريف النموذج والـ Extensions
│   └── migrations/
│       └── migration.sql            # SQL لإنشاء الجداول و HNSW index
├── public/
│   └── index.html                   # واجهة الدردشة (RTL — عربي)
├── prisma.config.ts                 # إعدادات Prisma Config
├── tsconfig.json                    # إعدادات TypeScript
├── package.json
├── env.example                      # نموذج متغيرات البيئة
└── message-lifecycle.md             # 📖 شرح مفصّل لمسار الطلب من البداية للنهاية
```

---

## ✅ متطلبات التشغيil

| الأداة | الإصدار المطلوب |
|--------|----------------|
| Node.js | v20 أو أحدث |
| npm | v9 أو أحدث |
| PostgreSQL | v14+ مع pgvector (للإنتاج) |

---

## ⚙️ إعداد المشروع

### 1. استنساخ المشروع وتثبيت الحزم

```bash
git clone <repository-url>
cd agent_docker
npm install
```

### 2. إعداد متغيرات البيئة

```bash
cp env.example .env
```

ثم عدّل `.env` بقيمك الفعلية (انظر [متغيرات البيئة](#-متغيرات-البيئة)).

### 3. إعداد قاعدة البيانات (للإنتاج مع pgvector)

```bash
# تشغيل migration لإنشاء الجداول والـ index
npx prisma migrate dev
```

أو تشغيل الـ SQL يدوياً إن كنت على Neon أو PlanetScale:

```sql
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TABLE "document_chunks" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "embedding" vector(768),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX ON document_chunks USING hnsw (embedding vector_cosine_ops);
```

### 4. بناء الـ Prisma Client

```bash
npx prisma generate
```

---

## 🔑 متغيرات البيئة

| المتغير | الوصف | القيمة الافتراضية |
|---------|-------|------------------|
| `PORT` | بورت الخادم | `3000` |
| `SERVER` | رابط الخادم | `http://localhost` |
| `MCP_SERVER_URL` | رابط MCP مخصص (اختياري) | — |
| `DATABASE_URL` | رابط PostgreSQL (NeonDB أو محلي) | — |
| `GEMINI_API_KEY` | مفتاح Gemini API | — |
| `GEMINI_MODEL` | اسم موديل Gemini | `gemini-3.7-flash` |
| `EMBEDDING_DIMS` | أبعاد المتجه | `768` |
| `VECTOR_DB` | نوع قاعدة المتجهات | `local` or `pgvector` |
| `LOCAL_DB_PATH` | مسار قاعدة البيانات المحلية | `./.local_vector_db` |

---

## 🗄 قواعد البيانات المدعومة

يدعم المشروع **نوعين** من قواعد بيانات المتجهات، يمكن التبديل بينهما عبر متغير `VECTOR_DB`:

### `local` — للتطوير المحلي (الافتراضي)

- لا تحتاج أي قاعدة بيانات خارجية
- تُخزَّن البيانات في ملف JSON محلي
- مناسبة للاختبار السريع

```env
VECTOR_DB=local
LOCAL_DB_PATH=./.local_vector_db
```

### `pgvector` — للإنتاج

- PostgreSQL مع امتداد pgvector
- يدعم HNSW index للبحث الدلالي السريع
- يستخدم cosine distance للمقارنة

```env
VECTOR_DB=pgvector
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
```

---

## 🚀 تشغيل المشروع

### وضع التطوير

```bash
npm run dev
```

يشغّل الخادم على `http://localhost:3000` مع Hot Reload تلقائي.

### وضع الإنتاج

```bash
npm run build
npm start
```

---

## 🌱 إدخال البيانات (Seeding)

يقرأ سكريبت الـ Seeding جميع ملفات البيانات من مجلد `src/data/` تلقائياً، ويحوّل كل سؤال وجواب إلى متجه embeddings ثم يخزّنه.

```bash
npm run seed
```

### صيغة ملف البيانات

يجب أن يُصدِّر الملف مصفوفة بهذه الصيغة:

```typescript
// src/data/my-data.ts
export const data = [
  {
    question: "ما هو Docker؟",
    answer: "Docker هو منصة لبناء وتشغيل التطبيقات في حاويات معزولة..."
  },
  // ...
];

export default data;
```

المشروع يأتي مع ملف `src/data/docker.ts` يحتوي على **30+ سؤال وجواب** شاملاً لأهم مواضيع Docker.

---

## 🔌 نقاط النهاية (API Endpoints)

### `POST /api/chat`

نقطة النهاية الرئيسية للدردشة. تُعيد رداً عبر **Server-Sent Events (SSE)**.

**الطلب:**
```json
{
  "message": "ما هو الفرق بين Docker Image وContainer؟"
}
```

**أحداث SSE المُعادة:**

| نوع الحدث | الوصف | البيانات |
|-----------|-------|---------|
| `chunk` | جزء من نص الرد | `{ type: "chunk", text: "..." }` |
| `theme` | تغيير ثيم الموقع | `{ type: "theme", value: "dark" \| "light" \| "toggle" }` |
| `error` | خطأ في المعالجة | `{ type: "error", text: "..." }` |
| `done` | انتهاء الرد | `{ type: "done" }` |

### `POST /mcp`

نقطة نهاية بروتوكول MCP — يستخدمها Gemini فقط داخلياً لاستدعاء الأدوات.

---

## 🛠 MCP Tools المتاحة

### `rag_search`

يبحث في قاعدة المعرفة الداخلية (Docker Q&A) باستخدام البحث الدلالي.

| المعامل | النوع | الوصف |
|---------|-------|-------|
| `query` | `string` | سؤال المستخدم أو عبارة البحث |
| `topK` | `number` (اختياري) | عدد النتائج (1-20، الافتراضي: 5) |

**آلية العمل:**
1. يُحوِّل الاستعلام إلى متجه embedding عبر `gemini-embedding-2`
2. يبحث في VectorStore بـ cosine similarity
3. يُعيد أقرب `topK` نتائج مع درجات التشابه
4. يبني Prompt مُعزَّز بالسياق لـ Gemini

### `change_site_theme`

يُغيّر مظهر الموقع بين الوضع الفاتح والداكن.

| القيمة | الوصف |
|--------|-------|
| `light` | تفعيل الوضع الفاتح |
| `dark` | تفعيل الوضع الداكن |
| `toggle` | التبديل بين الوضعين |

---

## 🖥 واجهة المستخدم

واجهة دردشة عربية (RTL) بميزات:

- **الثيم المزدوج**: وضع فاتح وداكن مع حفظ التفضيل
- **Streaming فوري**: يظهر الرد حرفاً بحرف بدون انتظار
- **Markdown rendering**: يدعم العناوين والقوائم والكود والروابط
- **XSS Protection**: يُعقِّم HTML عبر DOMPurify
- **تحكم ذكي بالإدخال**: يُعطَّل حقل الإدخال أثناء انتظار الرد

---

## 📦 البناء للإنتاج

```bash
npm run build
```

يُنفّذ هذا الأمر خطوتين:
1. `prisma generate` — يُولِّد Prisma Client
2. `tsc` — يُترجم TypeScript إلى JavaScript في مجلد `dist/`

الملف الرئيسي بعد البناء: `dist/server.js`

### النشر على Vercel

المشروع جاهز للنشر على Vercel كـ Serverless Function. يُصدِّر `server.ts` كـ `default export` ليتعرف عليه Vercel تلقائياً. تأكد من ضبط متغير `MCP_SERVER_URL` في إعدادات Vercel:

```
MCP_SERVER_URL=https://your-app.vercel.app/mcp
```

---

## 🔄 مسار الطلب الكامل

لفهم كيف يسير الطلب من لحظة كتابة المستخدم لرسالته حتى ظهور الرد على شاشته بشكل مفصّل، راجع:

📄 **[`message-lifecycle.md`](./message-lifecycle.md)**

يشرح هذا الملف كل خطوة في مسار الطلب: من SSE وGemini Streaming، مروراً باستدعاء MCP tools، وصولاً إلى RAG pipeline وعودة الرد للمتصفح.

---

## 🧰 التقنيات المستخدمة

| التقنية | الغرض |
|---------|-------|
| **Express.js** | خادم HTTP وSSE |
| **Google Gemini** | نموذج اللغة الكبير وتوليد الـ Embeddings |
| **MCP SDK** | بروتوكول تواصل الأدوات مع Gemini |
| **Prisma ORM** | التعامل مع PostgreSQL |
| **pgvector** | البحث الدلالي في متجهات الـ Embeddings |
| **TypeScript** | لغة البرمجة (strict mode) |
| **Zod** | التحقق من أنواع البيانات |
| **marked.js** | تحويل Markdown إلى HTML في المتصفح |
| **DOMPurify** | تعقيم HTML لمنع XSS |