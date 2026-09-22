import { NextRequest } from "next/server";
import { handleAiRequest } from "@/lib/ai-route";

export async function POST(request: NextRequest) {
  // The client must preview and choose extracted text before sending it here.
  return handleAiRequest(request, {
    intent: "document",
    maxMessageLength: 30000,
    // 30,000 characters plus JSON framing; allow multi-byte Kiswahili text.
    maxBodyBytes: 128 * 1024,
  });
}
