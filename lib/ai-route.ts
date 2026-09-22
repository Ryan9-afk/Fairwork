import { NextRequest, NextResponse } from "next/server";
import { DeepSeekRequestSchema, type SectorAgentResult } from "@/lib/ai-contracts";
import { runDeepSeekAgent } from "@/lib/deepseek";

type AiIntent = "setup" | "record" | "concern" | "document" | "question";

interface HandleAiRequestOptions {
  intent: AiIntent;
  maxMessageLength: number;
  maxBodyBytes?: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// This is intentionally a small in-memory guard. It protects a warm server
// instance from accidental bursts; production deployments should also use an
// edge/provider rate limit for cross-instance enforcement.
const rateLimit = new Map<string, RateLimitRecord>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_BODY_BYTES = 64 * 1024;

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  // Only use the first forwarded address because that is the convention used
  // by the hosting proxy. The value is a limiter key, never an authorization.
  return (forwarded?.split(",")[0]?.trim() || realIp || "unknown").slice(0, 128);
}

function consumeRateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const current = rateLimit.get(key);
  if (!current || current.resetAt <= now) {
    rateLimit.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }
  if (current.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  current.count += 1;
  // Opportunistic cleanup avoids a timer in serverless/edge runtimes.
  if (rateLimit.size > 1000) {
    for (const [entryKey, entry] of rateLimit) {
      if (entry.resetAt <= now) rateLimit.delete(entryKey);
    }
  }
  return { allowed: true, retryAfter: 0 };
}

function jsonResponse(body: Record<string, unknown>, status = 200, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

function asPublicResponse(result: SectorAgentResult, fallback: boolean) {
  return {
    // `reply` and `citations` preserve the contract used by the existing
    // assistant drawer. The structured result is what newer UI flows use.
    reply: result.explanation,
    citations: result.sourceIds,
    agent: result,
    fallback,
  };
}

export async function handleAiRequest(request: NextRequest, options: HandleAiRequestOptions) {
  const maxBodyBytes = options.maxBodyBytes ?? DEFAULT_BODY_BYTES;
  const advertisedLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(advertisedLength) && advertisedLength > maxBodyBytes) {
    return jsonResponse({ error: "Request is too large." }, 413);
  }

  const limit = consumeRateLimit(clientKey(request));
  if (!limit.allowed) {
    return jsonResponse(
      { error: "Too many requests. Please wait and try again.", fallback: true },
      429,
      { "Retry-After": String(limit.retryAfter) },
    );
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return jsonResponse({ error: "Unable to read request." }, 400);
  }
  if (new TextEncoder().encode(rawBody).byteLength > maxBodyBytes) {
    return jsonResponse({ error: "Request is too large." }, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: "Invalid JSON request." }, 400);
  }

  const payload = body && typeof body === "object" ? { ...(body as Record<string, unknown>), intent: options.intent } : body;
  const parsed = DeepSeekRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid request. Check the message and try again." }, 400);
  }
  if (parsed.data.message.length > options.maxMessageLength) {
    return jsonResponse({ error: "Message is too long for this request." }, 413);
  }

  try {
    const output = await runDeepSeekAgent(parsed.data);
    return jsonResponse(asPublicResponse(output.result, output.fallback));
  } catch {
    // Do not return upstream errors, provider details, or request contents.
    return jsonResponse({ error: "The assistant is temporarily unavailable.", fallback: true }, 503);
  }
}
