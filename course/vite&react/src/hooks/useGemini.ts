import { useCallback, useRef, useState } from "react";
import { GoogleGenAI } from "@google/genai";
import type { ChatMessage } from "../types/chat";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

function createId(): string {
  return crypto.randomUUID();
}

function extractStreamText(chunk: unknown): string {
  if (!chunk || typeof chunk !== "object") return "";

  const event = chunk as {
    output_text?: string;
    event_type?: string;
    delta?: { type?: string; text?: string };
  };

  if (typeof event.output_text === "string" && event.output_text.length > 0) {
    return event.output_text;
  }

  if (event.event_type === "step.delta" && event.delta?.type === "text" && typeof event.delta.text === "string") {
    return event.delta.text;
  }

  return "";
}

function extractInteractionId(chunk: unknown): string | undefined {
  if (!chunk || typeof chunk !== "object") return undefined;

  const event = chunk as {
    event_type?: string;
    interaction?: { id?: string };
  };

  if (event.event_type === "interaction.completed" && event.interaction?.id) {
    return event.interaction.id;
  }

  if (event.event_type === "interaction.created" && event.interaction?.id) {
    return event.interaction.id;
  }

  return undefined;
}

export function useGemini() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousInteractionIdRef = useRef<string | undefined>(undefined);

  const sendMessage = useCallback(async (userMessage: string) => {
    const trimmed = userMessage.trim();
    if (!trimmed) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setError("Missing VITE_GEMINI_API_KEY in .env");
      return;
    }

    const userEntry: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    const assistantId = createId();
    const assistantEntry: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userEntry, assistantEntry]);
    setIsLoading(true);
    setError(null);

    try {
      const stream = await ai.interactions.create({
        model: "gemini-3.6-flash",
        input: trimmed,
        stream: true,
        ...(previousInteractionIdRef.current ? { previous_interaction_id: previousInteractionIdRef.current } : {}),
      });

      let partialText = "";

      for await (const chunk of stream) {
        const interactionId = extractInteractionId(chunk);
        if (interactionId) {
          previousInteractionIdRef.current = interactionId;
        }

        const text = extractStreamText(chunk);
        if (!text) continue;

        partialText += text;
        setMessages((prev) => prev.map((message) => (message.id === assistantId ? { ...message, content: partialText } : message)));
      }

      if (!partialText.trim()) {
        setMessages((prev) => prev.map((message) => (message.id === assistantId ? { ...message, content: "No response received." } : message)));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get a response.";
      setError(message);
      setMessages((prev) => prev.map((entry) => (entry.id === assistantId ? { ...entry, content: `Error: ${message}` } : entry)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    previousInteractionIdRef.current = undefined;
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
}
