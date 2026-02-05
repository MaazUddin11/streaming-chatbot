"use client";

import { useState, useEffect, useRef } from "react";
import { Message, TokenUsage } from "@/types/chat";
import { streamChat, fetchHistory } from "@/lib/api";
import TokenProgress from "./TokenProgress";
import MessageList from "./MessageList";
import MessageInput, { SendMessagePayload } from "./MessageInput";
import { parseMessageContent } from "@/lib/fileExtractor";

const RESET_INTERVAL_SECONDS = 30;

// Rough estimate: ~4 characters per token for English text
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({
    current: 0,
    limit: 0,
    percentage: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [resetCountdown, setResetCountdown] = useState(RESET_INTERVAL_SECONDS);
  const initialLimitRef = useRef<number>(0);

  // Load conversation history on mount
  useEffect(() => {
    fetchHistory("default")
      .then((data) => {
        // Parse messages to extract file attachments and display content
        const parsedMessages: Message[] = data.messages.map((msg) => {
          if (msg.role === "user") {
            const parsed = parseMessageContent(msg.content);
            return {
              role: msg.role,
              content: parsed.displayContent,
              attachment: parsed.filename
                ? { filename: parsed.filename, type: parsed.fileType! }
                : undefined,
            };
          }
          return msg;
        });
        setMessages(parsedMessages);
        setTokenUsage(data.token_usage);
        initialLimitRef.current = data.token_usage.limit;
      })
      .catch(() => {
        setError("Unable to connect to server. Make sure the backend is running.");
      });
  }, []);

  // Countdown timer that resets token usage every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setResetCountdown((prev) => {
        if (prev <= 1) {
          // Reset token usage (display 0 on frontend)
          setTokenUsage((usage) => ({
            current: 0,
            limit: usage.limit,
            percentage: 0,
          }));
          setError(null);
          return RESET_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const isAtLimit = tokenUsage.limit > 0 && tokenUsage.current >= tokenUsage.limit;

  async function handleSend(payload: SendMessagePayload) {
    if (isAtLimit) {
      setError(`Token limit reached (${tokenUsage.limit}). Please wait for reset.`);
      return;
    }

    setError(null);

    // Estimate token cost of API message and update immediately
    const estimatedTokens = estimateTokens(payload.apiContent);
    setTokenUsage((prev) => ({
      current: prev.current + estimatedTokens,
      limit: prev.limit,
      percentage: prev.limit > 0 ? ((prev.current + estimatedTokens) / prev.limit) * 100 : 0,
    }));

    // Add user message immediately (display content for UI, with attachment info)
    const userMsg: Message = {
      role: "user",
      content: payload.displayContent,
      attachment: payload.attachment,
    };
    setMessages((prev) => [...prev, userMsg]);

    // Add empty assistant message that will fill via streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    setIsStreaming(true);

    try {
      // Send full API content to backend
      await streamChat(payload.apiContent, "default", (event) => {
        switch (event.type) {
          case "token_count":
            setTokenUsage({
              current: event.count,
              limit: event.limit,
              percentage: (event.count / event.limit) * 100,
            });
            break;

          case "content":
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = {
                ...last,
                content: last.content + event.content,
              };
              return updated;
            });
            break;

          case "done":
            setTokenUsage((prev) => ({
              current: event.token_count,
              limit: prev.limit,
              percentage: (event.token_count / prev.limit) * 100,
            }));
            break;
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      // Remove the empty assistant message on error
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last.role === "assistant" && last.content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold mb-2">Streaming Chatbot</h1>
        <TokenProgress
          current={tokenUsage.current}
          limit={tokenUsage.limit}
          resetCountdown={resetCountdown}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <MessageList messages={messages} isStreaming={isStreaming} />
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      {isAtLimit && !error && (
        <div className="px-4 py-2 bg-yellow-50 text-yellow-700 text-sm">
          Token limit reached. Resets in {resetCountdown}s.
        </div>
      )}

      <div className="border-t border-gray-200 p-4">
        <MessageInput onSend={handleSend} submitDisabled={isStreaming || isAtLimit} />
      </div>
    </div>
  );
}
