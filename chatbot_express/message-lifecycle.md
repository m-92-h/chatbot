# 🏛️ دورة حياة الرسالة في معمارية MCP + Gemini

> **اللغز:** كيف تنتقل الرسالة من `gemini.service.ts` إلى السيرفر `/mcp` بالرغم من أنهما موجودان في نفس المشروع؟

---

## الصورة الكبيرة (المعمارية)

**السر المباشر** هو أن Google Gemini في السحابة يلعب دور **المُنسّق والوسيط (Orchestrator)**.

أنت لا تُرسل الرسالة مباشرة من `gemini.service.ts` إلى سيرفر الـ MCP محلياً! بل ترسل الرسالة إلى **Gemini API** وتزوده بـ **عنوان السيرفر (URL)**. حينها يقرر Gemini بنفسه استدعاء سيرفر الـ MCP الخاص بك عن بُعد عبر طلب HTTP مفرد.

---

## 🔄 مسار انتقال الرسالة خطوة بخطوة

### 1️⃣ الفرونت إند (Frontend) ➔ السيرفر (`/api/chat`)

- يكتب المستخدم: `"كيف أشغل postgres مع pgvector؟"`
- يُرسل الفرونت إند الطلب عبر:

```typescript
fetch('/api/chat', { method: 'POST', body: JSON.stringify({ message }) })
```

- يستقبل ملف `server.ts` الطلب، ويفتح قناة SSE، ثم يستدعي الدالة:

```typescript
await GEMINI.generateResponse(message, ...);
```

---

### 2️⃣ ملف الخدمة (`gemini.service.ts`) ➔ سيرفرات Google Gemini في السحابة

داخل `generateResponse`، يتم إعداد الاتصال مع Gemini وترسل له:

- نص رسالة المستخدم (`input: prompt`)
- قائمة الأدوات المتاحة (`tools`)، ومكتوب فيها:

```typescript
tools: [
  {
    type: "mcp_server",
    name: "agent_docker",
    url: "https://your-domain.com/mcp" // عنوان سيرفر MCP الخاص بك
  }
]
```

> ⚡ **هنا الفكرة:** أنت تقول لـ Gemini: *"هذه رسالة المستخدم، وإذا احتجت أداة تخص Docker، استدعِ السيرفر الموجود في هذا الـ URL عبر بروتوكول MCP"*.

---

### 3️⃣ سيرفرات Google Gemini ➔ سيرفر الـ MCP الخاص بك (`POST /mcp`)

- يقرأ نموذج Gemini السؤال ويطابقه مع تعليمات النظام (`SYSTEM_INSTRUCTION`).
- يكتشف Gemini أن السؤال عن Docker، فيقرر أنه بحاجة لاستخدام الأداة `rag_search`.
- يقوم Gemini في السحابة بعمل **طلب HTTP تلقائي** من عنده إلى نقطة النهاية الخاصة بك:

```
POST https://your-domain.com/mcp
```

- هذا الطلب يكون بتنسيق **JSON-RPC** يطلب تنفيذ أداة `rag_search` ويسند لها البارامتر:

```json
{ "query": "كيف أشغل postgres مع pgvector؟" }
```

---

### 4️⃣ استلام الطلب داخل ملف السيرفر (`mcpServer.ts`)

- يستقبل `app.post("/mcp", ...)` في ملف `mcpServer.ts` هذا الطلب من Gemini.
- يمرر الطلب إلى مكتبة `@modelcontextprotocol/sdk` التي تبحث عن الأداة المسجلة باسم `rag_search`.

---

### 5️⃣ تنفيذ أداة الـ RAG والبحث بالمتجهات (`rag.tool.ts` & `ragEngine.ts`)

1. تنطلق دالة الأداة `rag_search`.
2. تستدعي `RagEngine.buildPrompt(query)`.
3. يتم توليد **Vector** للسؤال بـ Gemini Embedding.
4. يبحث في قاعدة البيانات **pgvector** عن أقرب إجابة مخزنة.
5. يتم بناء نص متكامل (Prompt) يحتوي على:
   - تعليمات النظام
   - السياق المسترجع من القاعدة
   - سؤال المستخدم
6. تُرجع الأداة هذه النتيجة إلى مكتبة الـ MCP SDK.

---

### 6️⃣ السيرفر الخاص بك (`/mcp`) ➔ سيرفرات Google Gemini

يقوم سيرفر `/mcp` بإعادة **رد JSON-RPC** يحتوي على نتيجة البحث إلى Gemini عبر شبكة الإنترنت.

---

### 7️⃣ توليد الرد المباشر بـ Streaming ➔ العميل (User)

- يستلم Gemini في السحابة سياق الـ RAG، ويقرأه ثم يبدأ بصياغة الإجابة النهائية.
- يرسل Gemini الإجابة على شكل **أجزاء (Chunks) متدفقة** لـ `gemini.service.ts`.
- يتم إطلاق الـ Callbacks وتمرير الأجزاء إلى `res.write` لـ SSE في `server.ts`:

```typescript
(chunk: string) => {
  if (chunk) sendEvent({ type: "chunk", text: chunk });
}
```

- يستقبل المتصفح الأجزاء حرفاً بحرف ويعرضها للمستخدم على الشاشة فوراً!

---

## 📊 ملخص المخطط الزمني للبيانات

```
User (Frontend)
    │
    │  POST /api/chat
    ▼
Your Server
    │
    │  SDK Call
    ▼
Google Gemini (Cloud)
    │
    │  POST /mcp (JSON-RPC)
    ▼
Your Server (/mcp)
    │
    │  Search
    ▼
pgvector DB
    │
    │  Results
    ▼
Your Server (/mcp)
    │
    │  JSON Response
    ▼
Google Gemini (Cloud)
    │
    │  Stream Chunks
    ▼
Your Server
    │
    │  SSE Stream
    ▼
User (Frontend)
```
