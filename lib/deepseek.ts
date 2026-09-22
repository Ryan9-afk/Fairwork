import { buildSectorSystemPrompt, getSectorAgentConfig } from "@/lib/sector-agents";
import { SectorAgentResultSchema, type DeepSeekRequest, type SectorAgentResult } from "@/lib/ai-contracts";
import { routeSectorFromText } from "@/lib/work-arrangements";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

export class DeepSeekUnavailableError extends Error {}

function fallbackResult(request: DeepSeekRequest): SectorAgentResult {
  const sector = request.sector || routeSectorFromText(request.message) || "construction";
  return {
    sector,
    intent: request.intent,
    suggestedFields: {},
    missingQuestions: ["Which type of work arrangement should we record?", "What was agreed, and what actually happened or was paid?"],
    explanation: "AI suggestions are unavailable right now. You can continue with manual entry and review the applicable guidance later.",
    assumptions: ["No AI classification was applied."],
    sourceIds: [],
    reviewStatus: "insufficient-information",
    confidence: "low",
  };
}

function parseJsonContent(content: string): unknown {
  // Some compatible providers wrap JSON in a markdown fence even when JSON
  // mode is requested. Strip only the fence; never execute returned content.
  const trimmed = content.trim();
  const unfenced = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    : trimmed;
  return JSON.parse(unfenced);
}

export async function runDeepSeekAgent(request: DeepSeekRequest): Promise<{ result: SectorAgentResult; fallback: boolean }> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === "your_deepseek_api_key_here") {
    return { result: fallbackResult(request), fallback: true };
  }

  const inferredSector = routeSectorFromText(request.message);
  const sector = request.sector || inferredSector || "construction";
  const system = [
    buildSectorSystemPrompt(sector, request.intent),
    request.sector
      ? "The worker's confirmed work arrangement selected this sector. Do not change it."
      : "No work arrangement is confirmed. Ask a short clarification question before treating the inferred sector as final.",
    "Respond as JSON with exactly these keys: sector, intent, suggestedFields, missingQuestions, explanation, assumptions, sourceIds, reviewStatus, confidence.",
    "Use language: " + (request.lang === "sw" ? "Kiswahili" : "English") + ". Suggested fields are drafts only and must be confirmed by the worker.",
  ].join("\n");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify({ message: request.message, context: request.context || {} }) },
        ],
        temperature: 0.2,
        max_tokens: 900,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!response.ok) throw new DeepSeekUnavailableError("DeepSeek returned an upstream error");
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new DeepSeekUnavailableError("DeepSeek returned no content");
    const parsed = SectorAgentResultSchema.safeParse(parseJsonContent(content));
    if (!parsed.success) throw new DeepSeekUnavailableError("DeepSeek response did not match the sector schema");
    const allowedSources = new Set(getSectorAgentConfig(sector).sourceIds);
    return {
      result: {
        ...parsed.data,
        // The request context, rather than model output, owns routing and
        // intent. This prevents a response from silently switching jobs.
        sector,
        intent: request.intent,
        sourceIds: parsed.data.sourceIds.filter((sourceId) => allowedSources.has(sourceId)),
      },
      fallback: false,
    };
  } catch {
    console.warn("DeepSeek request failed; using local fallback.");
    return { result: fallbackResult(request), fallback: true };
  } finally {
    clearTimeout(timeout);
  }
}
