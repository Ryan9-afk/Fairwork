import { NextRequest } from "next/server";
import { handleAiRequest } from "@/lib/ai-route";

export async function POST(request: NextRequest) {
  return handleAiRequest(request, { intent: "concern", maxMessageLength: 3000 });
}
