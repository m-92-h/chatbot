import type { ChatMessage } from "../types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed whitespace-pre-wrap wrap-break-word ${isUser ? "bg-[#E8F0FE] text-gray-900" : "bg-[#F1F3F4] text-gray-900"}`}>
        {message.content || (
          <span className="inline-flex items-center gap-1 text-gray-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400 [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400 [animation-delay:300ms]" />
          </span>
        )}
      </div>
    </div>
  );
}
