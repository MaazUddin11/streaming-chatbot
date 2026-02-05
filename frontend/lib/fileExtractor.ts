const SUPPORTED_TEXT_EXTENSIONS = [".txt", ".md", ".json", ".csv", ".xml", ".html", ".css", ".js", ".ts"];
const MAX_FILE_SIZE_MB = 5;

export interface FileExtractionResult {
  success: boolean;
  text?: string;
  filename: string;
  error?: string;
}

/**
 * Extract text content from a file (text files or PDFs).
 */
export async function extractTextFromFile(file: File): Promise<FileExtractionResult> {
  const filename = file.name;
  const extension = filename.substring(filename.lastIndexOf(".")).toLowerCase();

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > MAX_FILE_SIZE_MB) {
    return {
      success: false,
      filename,
      error: `File too large (${fileSizeMB.toFixed(1)}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB.`,
    };
  }

  try {
    if (extension === ".pdf") {
      const text = await extractTextFromPDF(file);
      return { success: true, text, filename };
    } else if (SUPPORTED_TEXT_EXTENSIONS.includes(extension)) {
      const text = await extractTextFromTextFile(file);
      return { success: true, text, filename };
    } else {
      return {
        success: false,
        filename,
        error: `Unsupported file type: ${extension}. Supported: ${[".pdf", ...SUPPORTED_TEXT_EXTENSIONS].join(", ")}`,
      };
    }
  } catch (err) {
    return {
      success: false,
      filename,
      error: err instanceof Error ? err.message : "Failed to extract text from file",
    };
  }
}

/**
 * Read text content from a plain text file.
 */
async function extractTextFromTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read text file"));
    reader.readAsText(file);
  });
}

/**
 * Extract text content from a PDF file using pdf.js.
 * Dynamically imports pdf.js to avoid SSR issues (DOMMatrix not defined in Node.js).
 */
async function extractTextFromPDF(file: File): Promise<string> {
  // Dynamic import to avoid SSR issues - pdf.js uses browser APIs
  const pdfjsLib = await import("pdfjs-dist");

  // Set worker source (must match installed version)
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://unpkg.com/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const textParts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    textParts.push(pageText);
  }

  return textParts.join("\n\n");
}

/**
 * Format extracted file content for inclusion in a chat message.
 */
export function formatFileContent(filename: string, content: string, userMessage: string): string {
  const parts: string[] = [];

  parts.push(`[Contents of ${filename}]`);
  parts.push(content.trim());

  if (userMessage.trim()) {
    parts.push("");
    parts.push(`[User message]`);
    parts.push(userMessage.trim());
  }

  return parts.join("\n");
}

export interface ParsedMessageContent {
  displayContent: string;
  filename?: string;
  fileType?: "text" | "pdf";
}

/**
 * Parse a message from history to extract file attachment info and display content.
 * Returns the original content if no file attachment pattern is detected.
 */
export function parseMessageContent(content: string): ParsedMessageContent {
  // Check if message starts with file content pattern
  const fileHeaderMatch = content.match(/^\[Contents of (.+?)\]\n/);

  if (!fileHeaderMatch) {
    // No file attachment, return as-is
    return { displayContent: content };
  }

  const filename = fileHeaderMatch[1];
  const isPdf = filename.toLowerCase().endsWith(".pdf");

  // Check if there's a user message section
  const userMessageMatch = content.match(/\n\[User message\]\n([\s\S]*)$/);

  let displayContent: string;
  if (userMessageMatch) {
    // Extract user's typed message
    displayContent = userMessageMatch[1].trim();
  } else {
    // No user message, just show "Attached: filename"
    displayContent = "";
  }

  return {
    displayContent,
    filename,
    fileType: isPdf ? "pdf" : "text",
  };
}
