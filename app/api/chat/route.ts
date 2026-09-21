import { NextRequest, NextResponse } from "next/server";

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
    const { message, lang } = (await req.json()) as { message?: string; lang?: string };

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json({
        fallback: true,
        message: "No Gemini API key configured on server",
      });
    }

    // Call Google Gemini API (gemini-2.5-flash or gemini-1.5-flash)
    const promptText = `User Language: ${lang === "sw" ? "Kiswahili" : "English"}
User Query: ${message}`;

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
      const errText = await response.text();
      console.warn("Gemini API call returned non-200:", response.status, errText);
      return NextResponse.json({
        fallback: true,
        status: response.status,
        details: errText,
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
    console.error("Chat API error:", error);
    return NextResponse.json({ fallback: true, error: String(error) });
  }
}
