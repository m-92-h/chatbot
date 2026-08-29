import { ChatWindow } from "./components/ChatWindow";
import { useGemini } from "./hooks/useGemini";

export default function App() {
  const { messages, isLoading, error, sendMessage, clearChat } = useGemini();

  return (
    <div className="flex h-svh w-full items-stretch justify-center bg-white p-0 sm:p-4">
      <main className="h-full w-full max-w-3xl">
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          error={error}
          onSend={sendMessage}
          onClear={clearChat}
        />
      </main>
    </div>
  );
}
