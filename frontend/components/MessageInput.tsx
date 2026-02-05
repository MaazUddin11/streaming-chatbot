"use client";

import { useState, useRef } from "react";
import { extractTextFromFile, formatFileContent, FileExtractionResult } from "@/lib/fileExtractor";
import { FileAttachment } from "@/types/chat";

export interface SendMessagePayload {
  displayContent: string;
  apiContent: string;
  attachment?: FileAttachment;
}

interface MessageInputProps {
  onSend: (payload: SendMessagePayload) => void;
  submitDisabled: boolean;
}

export default function MessageInput({ onSend, submitDisabled }: MessageInputProps) {
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractionStatus, setExtractionStatus] = useState<{
    loading: boolean;
    result: FileExtractionResult | null;
  }>({ loading: false, result: null });
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setExtractionStatus({ loading: true, result: null });

    extractTextFromFile(file).then((result) => {
      setExtractionStatus({ loading: false, result });
    });

    // Reset input so same file can be selected again
    e.target.value = "";
  }

  function handleRemoveFile() {
    setSelectedFile(null);
    setExtractionStatus({ loading: false, result: null });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const hasText = input.trim().length > 0;
    const hasValidFile = extractionStatus.result?.success && extractionStatus.result.text;

    if ((!hasText && !hasValidFile) || submitDisabled || extractionStatus.loading) return;

    const userText = input.trim();

    if (hasValidFile && extractionStatus.result) {
      const filename = extractionStatus.result.filename;
      const isPdf = filename.toLowerCase().endsWith(".pdf");

      onSend({
        displayContent: userText || `Attached: ${filename}`,
        apiContent: formatFileContent(filename, extractionStatus.result.text!, userText),
        attachment: {
          filename,
          type: isPdf ? "pdf" : "text",
        },
      });
    } else {
      onSend({
        displayContent: userText,
        apiContent: userText,
      });
    }

    setInput("");
    setSelectedFile(null);
    setExtractionStatus({ loading: false, result: null });
  }

  const canSubmit =
    !submitDisabled &&
    !extractionStatus.loading &&
    (input.trim().length > 0 || extractionStatus.result?.success);

  return (
    <div className="space-y-2">
      {/* File attachment preview */}
      {selectedFile && (
        <div className="flex items-center gap-2 text-sm">
          {extractionStatus.loading ? (
            <span className="text-gray-500">Extracting text from {selectedFile.name}...</span>
          ) : extractionStatus.result?.success ? (
            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{selectedFile.name}</span>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="ml-1 hover:text-green-900"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>{extractionStatus.result?.error || "Failed to extract file"}</span>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="ml-1 hover:text-red-900"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.json,.csv,.xml,.html,.css,.js,.ts,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={submitDisabled}
          className="rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Attach file"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={selectedFile ? "Add a message (optional)..." : "Type a message..."}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-indigo-500"
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-indigo-600 px-6 py-2 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
