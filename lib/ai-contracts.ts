import { z } from "zod";

export const SectorAgentResultSchema = z.object({
  sector: z.enum(["construction", "agriculture", "domestic", "gig_delivery"]),
  intent: z.enum(["setup", "record", "concern", "document", "question"]),
  suggestedFields: z.record(z.string(), z.unknown()).default({}),
  missingQuestions: z.array(z.string()).default([]),
  explanation: z.string().default(""),
  assumptions: z.array(z.string()).default([]),
  sourceIds: z.array(z.string()).default([]),
  reviewStatus: z.enum(["confirmed-input", "needs-review", "insufficient-information"]),
  confidence: z.enum(["high", "medium", "low"]),
});

export type SectorAgentResult = z.infer<typeof SectorAgentResultSchema>;

export const DeepSeekRequestSchema = z.object({
  // Chat and setup routes apply their smaller per-route limits. Document
  // analysis is allowed to submit up to 30,000 characters after preview.
  message: z.string().trim().min(1).max(30000),
  lang: z.enum(["en", "sw"]).default("en"),
  sector: z.enum(["construction", "agriculture", "domestic", "gig_delivery"]).optional(),
  intent: z.enum(["setup", "record", "concern", "document", "question"]).default("question"),
  context: z.record(z.string(), z.unknown()).optional(),
});

export type DeepSeekRequest = z.infer<typeof DeepSeekRequestSchema>;
