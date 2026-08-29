import { useState, type FormEvent, type KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-gray-200 bg-white p-3 sm:p-4">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message Gemini…"
        rows={1}
        disabled={disabled}
        className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14.5px] text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:bg-white disabled:opacity-60"
      />
      <button type="submit" disabled={disabled || !value.trim()} className="rounded-2xl bg-gray-900 px-4 py-2.5 text-[14.5px] font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40">
        Send
      </button>
    </form>
  );
}
