// Backwards-compatible alias for the existing assistant drawer. New flows
// should call /api/ai/chat so intent and sector-specific contracts are clear.
export { POST } from "@/app/api/ai/chat/route";
