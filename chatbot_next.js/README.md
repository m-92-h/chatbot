# 🐳 Docker AI Assistant — Next.js

<div align="center">
مساعد ذكي متخصص في Docker، مدعوم بـ Gemini AI مع محرك RAG للإجابة من قاعدة معرفة خاصة.
</div>

---

## نظرة عامة

| الميزة | التفاصيل |
|--------|-----------|
| **الإطار** | Next.js 16 (App Router) |
| **الذكاء الاصطناعي** | Google Gemini (streaming + MCP tools) |
| **RAG Engine** | pgvector (إنتاج) · JSON محلي (تطوير) |
| **قاعدة البيانات** | PostgreSQL + pgvector عبر NeonDB |
| **ORM** | Prisma 7 |
| **التصميم** | Tailwind CSS v4 |
| **النشر** | Vercel |

---

## المتطلبات الأساسية

- **Node.js** ≥ 20
- **npm** ≥ 10
- حساب على [NeonDB](https://neon.tech) (للإنتاج)
- مفتاح API من [Google AI Studio](https://aistudio.google.com)

---

## متغيرات البيئة

أنشئ ملف `.env` في جذر المشروع. **لا ترفع هذا الملف أبداً إلى Git.**

```env
# ─── إعدادات الخادم ───────────────────────────────────────────────
PORT=3000
SERVER=http://localhost

# رابط MCP مخصص (اتركه فارغاً للتطوير المحلي)
# سيُحدَّد تلقائياً من VERCEL_URL عند النشر على Vercel
# MCP_SERVER_URL=https://your-app.vercel.app/api/mcp

# ─── قاعدة البيانات (NeonDB PostgreSQL) ──────────────────────────
# احصل عليه من: neon.tech → مشروعك → Connection string
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# ─── Gemini API ───────────────────────────────────────────────────
# احصل على المفتاح من: aistudio.google.com/apikey
GEMINI_API_KEY=your-gemini-api-key

# اسم النموذج المستخدم
GEMINI_MODEL=gemini-3.7-flash

# ─── إعدادات RAG ──────────────────────────────────────────────────
# أبعاد المتجهات — يجب أن تتطابق مع gemini-embedding-2 (768)
EMBEDDING_DIMS=768

# ─── اختيار مخزن المتجهات ────────────────────────────────────────
# للتطوير المحلي: يحفظ المتجهات في ملف JSON دون الحاجة إلى DB
VECTOR_DB=local

# للإنتاج: يستخدم PostgreSQL + pgvector عبر NeonDB
# VECTOR_DB=pgvector

# ─── مسار ملف JSON المحلي (عند VECTOR_DB=local) ──────────────────
LOCAL_DB_PATH=./.local_vector_db
```

### شرح كل متغير

| المتغير | الوصف | مطلوب |
|---------|-------|--------|
| `DATABASE_URL` | رابط اتصال PostgreSQL الكامل من NeonDB بصيغة `postgresql://user:pass@host/db?sslmode=require` | ✅ للإنتاج |
| `GEMINI_API_KEY` | مفتاح API من Google AI Studio لتشغيل نموذج Gemini وتوليد المتجهات | ✅ دائماً |
| `GEMINI_MODEL` | اسم نموذج Gemini المستخدم للمحادثة (مثل `gemini-3.7-flash`) | ✅ دائماً |
| `EMBEDDING_DIMS` | عدد أبعاد متجه التضمين — يجب أن يكون `768` عند استخدام `gemini-embedding-2` | ✅ دائماً |
| `VECTOR_DB` | `local` للتطوير (JSON)، `pgvector` للإنتاج (PostgreSQL) | ✅ دائماً |
| `LOCAL_DB_PATH` | المسار الذي يُحفظ فيه ملف JSON للمتجهات المحلية | ⬜ محلياً فقط |
| `MCP_SERVER_URL` | رابط خادم MCP — يُحدَّد تلقائياً من `VERCEL_URL` على Vercel، أو اتركه فارغاً محلياً (يستخدم localhost) | ⬜ اختياري |
| `PORT` | رقم المنفذ عند التشغيل المحلي | ⬜ اختياري |


## تشغيل المشروع محلياً

```bash
# 1. تثبيت الحزم
npm install

# 2. نسخ ملف البيئة وتعديله
cp .env.example .env

# 3. تشغيل خادم التطوير
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000) في المتصفح.

---

## رفع البيانات إلى قاعدة البيانات

### للتطوير المحلي (VECTOR_DB=local)

يُنشئ ملف JSON في `.local_vector_db/index.json` — لا يحتاج اتصالاً بـ DB:

```bash
# تأكد أن VECTOR_DB=local في ملف .env
npm run seed
```

### للإنتاج (VECTOR_DB=pgvector مع NeonDB)

```bash
# 1. عدّل .env:
#    VECTOR_DB=pgvector
#    DATABASE_URL="postgresql://..."

# 2. شغّل سكربت البذر
npm run seed
```

### رفع ملف محدد فقط

```bash
# رفع ملف واحد بعينه
npx tsx src/scripts/seed.ts src/data/docker.ts

# رفع جميع الملفات في مجلد data/
npm run seed
```

### بنية ملفات البيانات (`data/`)

```typescript
// data/docker.ts
export interface DockerChunk {
  question: string;
  answer: string;
}

export const data: DockerChunk[] = [
  {
    question: "ما هو Docker؟",
    answer: "Docker هو...",
  },
  // ...
];

export default data;
```

> **ملاحظة:** يمكن تصدير البيانات إما عبر `export default` أو `export const data`. كلاهما مدعوم.

---

## النشر على Vercel

### 1. رفع الكود إلى GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/username/repo.git
git push -u origin main
```

### 2. إضافة متغيرات البيئة على Vercel

في لوحة إعدادات المشروع → **Environment Variables**، أضف:

| المتغير | القيمة |
|---------|--------|
| `DATABASE_URL` | رابط NeonDB الكامل |
| `GEMINI_API_KEY` | مفتاح Gemini |
| `GEMINI_MODEL` | `gemini-3.7-flash` |
| `EMBEDDING_DIMS` | `768` |
| `VECTOR_DB` | `pgvector` |

> `MCP_SERVER_URL` **لا تحتاج إضافته** — يُحدَّد تلقائياً من `VERCEL_URL`.

---

## بنية المشروع

```
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Layout الرئيسي
│   │   ├── page.tsx                # واجهة الدردشة
│   │   └── api/
│   │       ├── chat/route.ts       # API streaming للمحادثة
│   │       └── mcp/route.ts        # خادم MCP
│   ├── lib/
│   │   ├── prisma.ts               # Prisma Client singleton
│   │   ├── service/
│   │   │   └── gemini.service.ts   # Gemini AI wrapper
│   │   ├── rag/
│   │   │   ├── ragEngine.ts        # محرك RAG
│   │   │   └── vectorStore/
│   │   │       ├── vector.store.ts # Factory للـ backends
│   │   │       └── dbs/
│   │   │           ├── pgvector.db.ts  # PostgreSQL + pgvector
│   │   │           └── local.db.ts     # ملف JSON محلي
│   │   └── mcp/
│   │       ├── mcpServer.ts        # MCP Server factory
│   │       └── tools/
│   │           ├── rag.tool.ts     # أداة البحث RAG
│   │           └── theme.tool.ts   # أداة تغيير الثيم
│   ├── generated/
│   │   └── prisma/                 # Prisma Client (auto-generated)
│   │ 
│   ├── data/
│   │   └── docker.ts                   # بيانات Q&A لبذر قاعدة البيانات
│   │
│   └── scripts/
│       └── seed.ts                     # سكربت رفع البيانات
├── prisma/
│   ├── schema.prisma               # تعريف قاعدة البيانات
│   └── migrations/                 # ملفات migrations
├── prisma7.config.ts               # إعداد Prisma 7
├── .env                            # متغيرات البيئة (لا ترفعها)
└── package.json
```