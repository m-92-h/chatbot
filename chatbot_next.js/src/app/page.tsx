"use client";

import { useState, useRef, useEffect } from "react";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

type Message = {
  id: string;
  role: "user" | "bot";
  text: string;
  streaming?: boolean;
};

type Theme = "light" | "dark";

/* ── Docker-themed icon ── */
const DockerIcon = () => (
  <svg viewBox="0 0 40 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" aria-hidden="true">
    <rect x="1" y="10" width="6" height="6" rx="1" fill="currentColor" opacity="0.9" />
    <rect x="9" y="10" width="6" height="6" rx="1" fill="currentColor" opacity="0.9" />
    <rect x="17" y="10" width="6" height="6" rx="1" fill="currentColor" opacity="0.9" />
    <rect x="9" y="2" width="6" height="6" rx="1" fill="currentColor" opacity="0.9" />
    <rect x="17" y="2" width="6" height="6" rx="1" fill="currentColor" opacity="0.9" />
    <rect x="17" y="18" width="6" height="6" rx="1" fill="currentColor" opacity="0.5" />
    <path d="M33 14c-1-5-6-6-8-4-1-3-5-4-7-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    <path d="M0 19c3 5 10 6 14 5h14c3 0 5-2 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
  </svg>
);

const SunIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
      clipRule="evenodd"
    />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      text: "مرحباً! أنا مساعدك المتخصص في Docker. اسألني عن أي شيء — من الحاويات والشبكات إلى Compose والنشر على الإنتاج.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const applyTheme = (value: "light" | "dark" | "toggle") => {
    setTheme((prev) => {
      if (value === "toggle") return prev === "dark" ? "light" : "dark";
      return value;
    });
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text };
    const botMsgId = crypto.randomUUID();
    const botMsg: Message = { id: botMsgId, role: "bot", text: "", streaming: true };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok || !res.body) {
        setMessages((prev) => prev.map((m) => (m.id === botMsgId ? { ...m, text: "حدث خطأ أثناء الاتصال بالخادم.", streaming: false } : m)));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let replyText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let event: Record<string, unknown>;
          try {
            event = JSON.parse(line.slice(6)) as Record<string, unknown>;
          } catch {
            continue;
          }

          if (event.type === "chunk") {
            replyText += event.text as string;
            setMessages((prev) => prev.map((m) => (m.id === botMsgId ? { ...m, text: replyText } : m)));
          } else if (event.type === "theme") {
            applyTheme(event.value as "light" | "dark" | "toggle");
          } else if (event.type === "error") {
            setMessages((prev) => prev.map((m) => (m.id === botMsgId ? { ...m, text: event.text as string, streaming: false } : m)));
          } else if (event.type === "done") {
            setMessages((prev) => prev.map((m) => (m.id === botMsgId ? { ...m, streaming: false } : m)));
          }
        }
      }
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === botMsgId ? { ...m, text: "حدث خطأ أثناء الاتصال بالخادم.", streaming: false } : m)));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const renderMarkdown = (text: string) => {
    if (!text) return "";
    const raw = marked.parse(text) as string;
    return DOMPurify.sanitize(raw);
  };

  const isDark = theme === "dark";

  return (
    <div
      className={`
        min-h-screen w-full flex items-center justify-center p-4 transition-colors duration-300
        ${isDark ? "bg-[#0a0f1a]" : "bg-[#f0f4f8]"}
      `}
    >
      {/* Ambient glow — signature element */}
      <div
        aria-hidden="true"
        className={`
          pointer-events-none fixed inset-0 overflow-hidden
        `}
      >
        <div
          className={`
            absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[120px] opacity-20
            ${isDark ? "bg-[#2496ed]" : "bg-[#2496ed]"}
          `}
        />
      </div>

      {/* Chat card */}
      <div
        className={`
          relative z-10 w-full max-w-2xl h-[88vh] flex flex-col rounded-2xl overflow-hidden
          border shadow-2xl transition-colors duration-300
          ${isDark ? "bg-[#0d1526] border-[#1e3a5f] shadow-[#2496ed]/10" : "bg-white border-[#bcd6f0] shadow-[#2496ed]/10"}
        `}
      >
        {/* ── Header ── */}
        <header
          className={`
            flex-shrink-0 flex items-center justify-between px-5 py-4
            border-b transition-colors duration-300
            ${isDark ? "border-[#1e3a5f]" : "border-[#ddeaf6]"}
          `}
        >
          <div className="flex items-center gap-3">
            <div
              className={`
                flex items-center justify-center w-9 h-9 rounded-xl
                ${isDark ? "bg-[#2496ed]/15 text-[#2496ed]" : "bg-[#2496ed]/10 text-[#1a75c4]"}
              `}
            >
              <DockerIcon />
            </div>
            <div>
              <h1
                className={`
                  text-sm font-semibold tracking-tight leading-none
                  ${isDark ? "text-white" : "text-[#0d1526]"}
                `}
              >
                Docker Assistant
              </h1>
              <p
                className={`
                  text-[11px] mt-0.5 leading-none
                  ${isDark ? "text-[#4a7fa8]" : "text-[#6699bb]"}
                `}
              >
                مدعوم بـ Gemini AI · RAG Engine
              </p>
            </div>
          </div>

          {/* Status dot + theme toggle */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className={`text-[11px] ${isDark ? "text-[#4a7fa8]" : "text-[#6699bb]"}`}>متصل</span>
            </span>

            <button
              onClick={() => applyTheme("toggle")}
              aria-label={isDark ? "تفعيل الوضع المشرق" : "تفعيل الوضع الداكن"}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                border transition-all duration-200 cursor-pointer
                ${isDark ? "border-[#1e3a5f] text-[#4a7fa8] hover:text-[#2496ed] hover:border-[#2496ed]/40" : "border-[#bcd6f0] text-[#4a7fa8] hover:text-[#1a75c4] hover:border-[#2496ed]/40"}
              `}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
              <span>{isDark ? "فاتح" : "داكن"}</span>
            </button>
          </div>
        </header>

        {/* ── Messages ── */}
        <main
          className={`
            flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4
            scrollbar-thin
            ${isDark ? "scrollbar-thumb-[#1e3a5f]" : "scrollbar-thumb-[#bcd6f0]"}
          `}
        >
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {/* Bot avatar */}
              {msg.role === "bot" && (
                <div
                  className={`
                    flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mr-2 mt-0.5
                    ${isDark ? "bg-[#2496ed]/15 text-[#2496ed]" : "bg-[#2496ed]/10 text-[#1a75c4]"}
                  `}
                >
                  <DockerIcon />
                </div>
              )}

              <div
                className={`
                  max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                  transition-colors duration-300
                  ${
                    msg.role === "user"
                      ? isDark
                        ? "bg-[#2496ed] text-white rounded-br-sm"
                        : "bg-[#1a75c4] text-white rounded-br-sm"
                      : isDark
                        ? "bg-[#111e33] text-[#c8ddf0] border border-[#1e3a5f] rounded-bl-sm"
                        : "bg-[#f0f6fc] text-[#0d2a45] border border-[#ddeaf6] rounded-bl-sm"
                  }
                `}
              >
                {msg.role === "bot" ? (
                  <div
                    className={`prose prose-sm max-w-none
                      ${isDark ? "prose-invert prose-code:bg-[#0a0f1a] prose-pre:bg-[#0a0f1a] prose-pre:border prose-pre:border-[#1e3a5f]" : "prose-code:bg-[#e8f2fa] prose-pre:bg-[#e8f2fa]"}
                      prose-code:text-[#2496ed] prose-code:rounded prose-code:px-1 prose-code:font-mono prose-code:text-xs
                      prose-pre:rounded-xl prose-pre:text-xs prose-pre:overflow-x-auto
                      prose-a:text-[#2496ed] prose-a:no-underline hover:prose-a:underline
                    `}
                    dangerouslySetInnerHTML={{
                      __html: msg.text
                        ? renderMarkdown(msg.text)
                        : msg.streaming
                          ? `<span class="inline-flex gap-1">
                               <span class="w-1.5 h-1.5 rounded-full bg-[#2496ed] animate-bounce" style="animation-delay:0ms"></span>
                               <span class="w-1.5 h-1.5 rounded-full bg-[#2496ed] animate-bounce" style="animation-delay:150ms"></span>
                               <span class="w-1.5 h-1.5 rounded-full bg-[#2496ed] animate-bounce" style="animation-delay:300ms"></span>
                             </span>`
                          : "",
                    }}
                  />
                ) : (
                  <span className="whitespace-pre-wrap">{msg.text}</span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </main>

        {/* ── Input area ── */}
        <footer
          className={`
            flex-shrink-0 px-4 py-4 border-t transition-colors duration-300
            ${isDark ? "border-[#1e3a5f]" : "border-[#ddeaf6]"}
          `}
        >
          {/* Suggested prompts — visible only when no conversation yet */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {["ما هو Docker Compose؟", "كيف أُحسّن صورة Node.js؟", "ما الفرق بين VM والحاوية؟"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className={`
                    text-[11px] px-3 py-1.5 rounded-full border cursor-pointer
                    transition-all duration-150
                    ${isDark ? "border-[#1e3a5f] text-[#4a7fa8] hover:border-[#2496ed]/50 hover:text-[#2496ed]" : "border-[#bcd6f0] text-[#4a7fa8] hover:border-[#2496ed]/50 hover:text-[#1a75c4]"}
                  `}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-end">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اسأل عن Docker..."
              disabled={loading}
              autoComplete="off"
              dir="auto"
              className={`
                flex-1 px-4 py-3 rounded-xl text-sm outline-none
                border transition-all duration-200
                placeholder:text-[#4a7fa8]
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isDark ? "bg-[#111e33] text-white border-[#1e3a5f] focus:border-[#2496ed]/60 focus:ring-1 focus:ring-[#2496ed]/20" : "bg-[#f0f6fc] text-[#0d2a45] border-[#bcd6f0] focus:border-[#2496ed]/60 focus:ring-1 focus:ring-[#2496ed]/20"}
              `}
            />

            <button
              onClick={() => void sendMessage()}
              disabled={loading || !input.trim()}
              aria-label="إرسال"
              className={`
                flex items-center justify-center w-11 h-11 rounded-xl
                font-semibold transition-all duration-200 cursor-pointer
                ${loading || !input.trim() ? (isDark ? "bg-[#1e3a5f] text-[#4a7fa8] cursor-not-allowed" : "bg-[#ddeaf6] text-[#6699bb] cursor-not-allowed") : "bg-[#2496ed] text-white hover:bg-[#1a75c4] active:scale-95 shadow-lg shadow-[#2496ed]/25"}
              `}
            >
              <SendIcon />
            </button>
          </div>

          <p
            className={`
              text-center text-[10px] mt-2.5
              ${isDark ? "text-[#2a4a68]" : "text-[#a0bcd4]"}
            `}
          >
            Docker Assistant · اضغط Enter للإرسال
          </p>
        </footer>
      </div>
    </div>
  );
}
