"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_QUESTIONS = [
  "What's the condition of this car?",
  "How many km has this car run?",
  "Is it good for highway driving?",
  "What features does it have?",
];

export function VehicleChat({ vehicleId }: { vehicleId: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "Hi! I know everything about this car. Ask me about its condition, features, mileage, or whether it's right for your trip.",
        },
      ]);
    }
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok || !res.body) throw new Error("Failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: assistantText },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 pl-4 pr-5 py-3 bg-[#1A1A1A] hover:bg-[#333] text-white text-sm font-semibold rounded-full shadow-xl shadow-black/20 transition-all hover:scale-105 cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-[#FF4D00] flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
            </svg>
          </div>
          Ask about this car
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl shadow-black/20 border border-[#E8E6E1] flex flex-col overflow-hidden" style={{ height: "480px" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0EFEC] bg-[#FAFAF8]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#FF4D00] flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">Car AI</p>
                <p className="text-[10px] text-[#999]">Ask anything about this car</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F0EFEC] text-[#999] hover:text-[#1A1A1A] transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#E8E6E1] [&::-webkit-scrollbar-thumb]:rounded-full">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-[#FF4D00] flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[80%] text-sm rounded-2xl px-3.5 py-2.5 ${
                    msg.role === "user"
                      ? "bg-[#FF4D00] text-white rounded-tr-sm"
                      : "bg-[#F5F5F0] text-[#1A1A1A] rounded-tl-sm"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-p:my-0.5 prose-p:text-[#1A1A1A] prose-strong:text-[#1A1A1A] prose-li:text-[#1A1A1A]">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                      {loading && i === messages.length - 1 && !msg.content && (
                        <span className="inline-flex gap-1">
                          <span className="w-1.5 h-1.5 bg-[#999] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 bg-[#999] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 bg-[#999] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                      )}
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-[#E8E6E1] text-[#6B6B6B] hover:border-[#FF4D00] hover:text-[#FF4D00] transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-[#F0EFEC] flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send(input);
              }}
              placeholder="Ask anything about this car..."
              disabled={loading}
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-[#E8E6E1] focus:outline-none focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00]/20 transition-all placeholder:text-[#BBB] disabled:opacity-50"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#FF4D00] hover:bg-[#E64500] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
