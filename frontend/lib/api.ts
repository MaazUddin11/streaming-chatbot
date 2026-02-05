import { SSEEvent, HistoryResponse } from "@/types/chat";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

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
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, conversation_id: conversationId }),
    });
  } catch (fetchError) {
    // Network error - server unreachable or CORS blocked
    throw new Error("Unable to connect to server. Make sure the backend is running.");
  }

  if (!response.ok) {
    // Try to parse error detail from backend
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        throw new Error(errorData.detail);
      }
    } catch (parseError) {
      // If parsing fails, use generic message
      if (parseError instanceof Error && !parseError.message.includes("JSON")) {
        throw parseError;
      }
    }
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
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/history/${conversationId}`);
  } catch {
    throw new Error("Unable to connect to server. Make sure the backend is running.");
  }
  if (!response.ok) {
    throw new Error(`History request failed: ${response.status}`);
  }
  return response.json();
}
