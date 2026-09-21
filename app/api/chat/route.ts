import { NextRequest, NextResponse } from "next/server";

// Rate limiting: IP-based sliding window (max 10 requests per 60 seconds per IP)
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_MESSAGE_LENGTH = 1000;
const MAX_CONTENT_LENGTH_BYTES = 10 * 1024; // 10 KB

// Periodic cleanup of stale rate-limit entries (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref?.();

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count += 1;
  return { allowed: true };
}

const SYSTEM_INSTRUCTION = `You are the Fairwork Pulse AI Legal Rights Assistant, a calm, protective, and knowledgeable guide for Kenyan casual, informal, and gig workers (e.g., construction workers, domestic staff, tea pickers, boda boda delivery riders).

Your responsibilities:
1. Explain workers' rights under Kenyan Law:
   - Employment Act, 2007 (Contracts §§ 8-10, Wage payment & unlawful deductions §§ 17-19, Working hours & rest day § 27, Housing entitlement § 31, Maternity leave § 29 & protection from dismissal § 46).
   - Regulation of Wages (General) Order (Standard hours, 1.5× normal overtime multiplier, 2.0× double-time multiplier for Sundays & Public Holidays).
   - Work Injury Benefits Act (WIBA), 2007 (Employer strict liability for on-site injuries § 10, mandatory reporting of accidents § 16, medical aid & treatment expenses § 26).
   - Conciliation procedures before Sub-County Labour Officers and COTU-K trade unions.
2. Provide clear, empathetic answers in English or Kiswahili based on the user's language.
3. Help the worker understand how to document their claim in their "Haki Dossier" with contemporaneous shift logs, M-Pesa screenshots, and medical receipts.
4. Keep the tone respectful, clear, and reassuring—never bureaucratic or alarmist. Always remind workers that this is statutory information and guidance under Kenyan law, not formal court representation.`;

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce payload size limit
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_CONTENT_LENGTH_BYTES) {
      return NextResponse.json(
        { error: "Payload exceeds 10KB size limit" },
        { status: 413 }
      );
    }

    // 2. Enforce IP-based rate limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const clientIp = (forwarded ? forwarded.split(",")[0].trim() : null) || realIp || "127.0.0.1";

    const { allowed, retryAfter } = checkRateLimit(clientIp);
    if (!allowed) {
      return NextResponse.json(
        {
          fallback: true,
          error: "Too many requests. Please wait a moment before asking again.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter || 60),
          },
        }
      );
    }

    // 3. Parse and validate body
    let body: { message?: unknown; lang?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { message, lang } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message exceeds maximum permitted limit of ${MAX_MESSAGE_LENGTH} characters` },
        { status: 400 }
      );
    }

    const sanitizedLang = typeof lang === "string" && lang.toLowerCase() === "sw" ? "sw" : "en";

    // 4. Verify API Key
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json({
        fallback: true,
        message: "Offline statutory mode active",
      });
    }

    // 5. Call Google Gemini API
    const promptText = `User Language: ${sanitizedLang === "sw" ? "Kiswahili" : "English"}
User Query: ${trimmed}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: promptText }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 600,
        },
      }),
    });

    if (!response.ok) {
      // Securely log details on server, NEVER leak raw upstream errors to client
      const errText = await response.text();
      console.warn("Gemini upstream API returned non-200 status:", response.status, errText);
      return NextResponse.json({
        fallback: true,
      });
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const replyText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

    if (!replyText) {
      return NextResponse.json({ fallback: true });
    }

    return NextResponse.json({
      reply: replyText,
      citations: [
        "Employment Act, 2007",
        "Regulation of Wages Order",
        "WIBA, 2007",
      ],
    });
  } catch (error) {
    // Log securely server-side; return sanitized fallback response
    console.error("Chat API internal error:", error);
    return NextResponse.json({ fallback: true });
  }
}
