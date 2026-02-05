"use client";

import { useEffect, useRef } from "react";
import { Message } from "@/types/chat";

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
}

function FileAttachmentChip({ filename, type }: { filename: string; type: "text" | "pdf" }) {
  const isPdf = type === "pdf";

  return (
    <div className="flex items-center gap-2 bg-blue-400/30 rounded-lg px-3 py-2 mb-2">
      {isPdf ? (
        <svg className="w-5 h-5 text-red-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13a1 1 0 011-1h.5v3h-.5a1 1 0 01-1-1v-1zm3 0c0-.55.45-1 1-1h.5c.55 0 1 .45 1 1v1c0 .55-.45 1-1 1H12v1h1.5v1H12c-.55 0-1-.45-1-1v-3zm4.5 0a1 1 0 011-1h1v1h-1v.5h1v1h-1V17h-1v-4z"/>
        </svg>
      ) : (
        <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      <span className="text-sm text-blue-100 truncate max-w-[200px]">{filename}</span>
    </div>
  );
}

export default function MessageList({
  messages,
  isStreaming,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Send a message to start chatting
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {messages.map((message, index) => {
        const isUser = message.role === "user";
        const isLastAssistant =
          !isUser && index === messages.length - 1 && isStreaming;

        return (
          <div
            key={index}
            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                isUser
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-white"
              }`}
            >
              {/* File attachment preview */}
              {message.attachment && (
                <FileAttachmentChip
                  filename={message.attachment.filename}
                  type={message.attachment.type}
                />
              )}
              {/* Message content */}
              {message.content && (
                <div className="whitespace-pre-wrap">{message.content}</div>
              )}
              {isLastAssistant && (
                <span className="inline-block w-1.5 h-4 ml-0.5 bg-white/60 animate-pulse" />
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
