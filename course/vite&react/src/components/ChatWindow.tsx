import { useEffect, useRef } from "react";
import type { ChatMessage } from "../types/chat";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSend: (message: string) => void;
  onClear: () => void;
}

export function ChatWindow({ messages, isLoading, error, onSend, onClear }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-5">
        <div>
          <h1 className="text-[15px] font-semibold text-gray-900">Gemini Chat</h1>
          <p className="text-[13px] text-gray-500">gemini-3.6-flash</p>
        </div>
        <button type="button" onClick={onClear} disabled={messages.length === 0 && !error} className="rounded-xl px-3 py-1.5 text-[13px] font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
          Clear chat
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8F9FA] px-3 py-4 sm:px-5">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-[14.5px] text-gray-500">Send a message to start chatting.</p>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {error && <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-[13px] text-red-700">{error}</div>}

      <ChatInput onSend={onSend} disabled={isLoading} />
    </div>
  );
}
