"use client";

import { useState, FormEvent } from "react";

interface MessageInputProps {
  onSend: (message: string) => void;
  submitDisabled: boolean;
}

export default function MessageInput({ onSend, submitDisabled }: MessageInputProps) {
  const [input, setInput] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || submitDisabled) return;
    onSend(trimmed);
    setInput("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-indigo-500"
      />
      <button
        type="submit"
        disabled={submitDisabled || !input.trim()}
        className="rounded-lg bg-indigo-600 px-6 py-2 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </form>
  );
}
