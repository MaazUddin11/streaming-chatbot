import { SSEEvent, HistoryResponse } from "@/types/chat";

const API_BASE = "/api";
// Bypass Next.js proxy for streaming - it buffers SSE responses
const STREAM_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

/**
 * Send a chat message and stream the response via SSE.
 *
 * Uses fetch + ReadableStream because the native EventSource API
 * only supports GET requests, and our /chat endpoint is POST.
 */
export async function streamChat(
  message: string,
  conversationId: string = "default",
  onEvent: (event: SSEEvent) => void
): Promise<void> {
  const response = await fetch(`${STREAM_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, conversation_id: conversationId }),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status} - ${response.statusText}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by double newlines
    const events = buffer.split("\n\n");
    // Keep the last (potentially incomplete) chunk in the buffer
    buffer = events.pop() || "";

    for (const event of events) {
      for (const line of event.split("\n")) {
        if (line.startsWith("data: ")) {
          try {
            const parsed: SSEEvent = JSON.parse(line.slice(6));
            onEvent(parsed);
          } catch {
            console.warn("Failed to parse SSE data:", line);
          }
        }
      }
    }
  }
}

/**
 * Fetch conversation history from the backend.
 */
export async function fetchHistory(
  conversationId: string = "default"
): Promise<HistoryResponse> {
  const response = await fetch(`${API_BASE}/history/${conversationId}`);
  if (!response.ok) {
    throw new Error(`History request failed: ${response.status}`);
  }
  return response.json();
}
