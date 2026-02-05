export interface FileAttachment {
  filename: string;
  type: "text" | "pdf";
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  attachment?: FileAttachment;
}

export interface TokenUsage {
  current: number;
  limit: number;
  percentage: number;
}

export type SSEEvent =
  | { type: "token_count"; count: number; limit: number }
  | { type: "content"; content: string }
  | { type: "done"; token_count: number };

export interface HistoryResponse {
  messages: Message[];
  token_usage: TokenUsage;
}
