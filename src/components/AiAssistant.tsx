"use client";

import * as React from "react";
import { Bot, X, Send, Sparkles, Loader2, ChevronDown, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, '<code class="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/^### (.*?)$/gm, '<h3 class="font-bold text-sm mt-3 mb-1">$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2 class="font-bold text-base mt-3 mb-1">$1</h2>')
    .replace(/^- (.*?)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, "<br/>");
}

export function AiAssistant() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: "assistant",
      content:
        "Halo! Saya **AssetAI** 👋, asisten pintar untuk sistem inventaris Anda.\n\nSaya dapat membantu Anda:\n- 📊 Menganalisis kondisi aset\n- 📈 Memberikan insight dari data inventaris\n- 💡 Memberikan rekomendasi pengelolaan aset\n\nAda yang bisa saya bantu?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasNewMessage, setHasNewMessage] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  React.useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const historyForApi = messages
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...historyForApi, { role: "user", content: trimmed }],
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Gagal mendapatkan respons AI.");
      }

      const aiMessage: Message = {
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      if (!isOpen) {
        setHasNewMessage(true);
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const SUGGESTED_PROMPTS = [
    "Berapa total aset yang rusak?",
    "Analisis kondisi inventaris saya",
    "Unit kerja mana yang paling banyak asetnya?",
  ];

  return (
    <>
      {/* Floating Chat Panel */}
      <div
        className={[
          "fixed bottom-24 right-4 md:right-6 z-50 w-[92vw] max-w-[420px]",
          "bg-white rounded-2xl shadow-2xl border border-zinc-200/80",
          "flex flex-col overflow-hidden",
          "transition-all duration-300 ease-out origin-bottom-right",
          isOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none",
        ].join(" ")}
        style={{ height: isOpen ? "520px" : "0px" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex-shrink-0">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight">AssetAI</p>
            <p className="text-xs text-emerald-100 truncate">
              Powered by NVIDIA Nemotron Ultra
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
            aria-label="Tutup chat"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50/50">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={[
                "flex gap-2 items-end",
                msg.role === "user" ? "flex-row-reverse" : "flex-row",
              ].join(" ")}
            >
              {/* Avatar */}
              <div
                className={[
                  "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                  msg.role === "user"
                    ? "bg-emerald-600"
                    : "bg-gradient-to-br from-teal-500 to-emerald-600",
                ].join(" ")}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Sparkles className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={[
                  "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-emerald-600 text-white rounded-br-sm"
                    : "bg-white text-zinc-800 shadow-sm border border-zinc-100 rounded-bl-sm",
                ].join(" ")}
              >
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: formatMarkdown(msg.content),
                  }}
                />
                <p
                  className={[
                    "text-[10px] mt-1.5",
                    msg.role === "user"
                      ? "text-emerald-100 text-right"
                      : "text-zinc-400",
                  ].join(" ")}
                >
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-2 items-end">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="bg-white shadow-sm border border-zinc-100 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                <div className="flex gap-2 items-center text-xs text-zinc-500 font-medium">
                  <div className="flex gap-1 items-center">
                    <span
                      className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <span>Menganalisis data inventaris...</span>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2 text-sm">
              ⚠️ {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts (only shown when first opening) */}
        {messages.length === 1 && (
          <div className="px-3 pb-2 flex flex-wrap gap-1.5 bg-zinc-50/50">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setInput(p);
                  setTimeout(() => handleSend(), 50);
                  setInput(p);
                }}
                className="text-xs bg-white border border-zinc-200 rounded-full px-3 py-1 text-zinc-600 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="flex-shrink-0 px-3 pb-3 pt-2 bg-white border-t border-zinc-100">
          <div className="flex gap-2 items-end bg-zinc-50 rounded-xl border border-zinc-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanya sesuatu... (Enter untuk kirim)"
              rows={1}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm resize-none outline-none placeholder:text-zinc-400 max-h-[100px] leading-relaxed"
              style={{
                height: "auto",
                minHeight: "40px",
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              id="ai-send-btn"
              className={[
                "mb-2 mr-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0",
                input.trim() && !isLoading
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed",
              ].join(" ")}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-center text-[10px] text-zinc-400 mt-1.5">
            AI dapat membuat kesalahan. Verifikasi informasi penting.
          </p>
        </div>
      </div>

      {/* Floating Trigger Button */}
      <button
        id="ai-assistant-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        className={[
          "fixed bottom-6 right-4 md:right-6 z-50",
          "w-14 h-14 rounded-full shadow-lg",
          "flex items-center justify-center",
          "transition-all duration-300 ease-out",
          "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
          "hover:scale-110 hover:shadow-emerald-200 hover:shadow-xl",
          "active:scale-95",
          isOpen ? "rotate-0" : "rotate-0",
        ].join(" ")}
        aria-label="Buka Asisten AI"
      >
        {/* Pulse ring */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30" />
        )}

        {/* Badge */}
        {hasNewMessage && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white" />
        )}

        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Sparkles className="w-6 h-6" />
        )}
      </button>
    </>
  );
}
