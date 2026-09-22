import { afterEach, describe, expect, it } from "vitest";
import { runDeepSeekAgent } from "./deepseek";

const originalKey = process.env.DEEPSEEK_API_KEY;

afterEach(() => {
  process.env.DEEPSEEK_API_KEY = originalKey;
});

describe("runDeepSeekAgent without an API key", () => {
  it("falls back and infers the sector from the message", async () => {
    delete process.env.DEEPSEEK_API_KEY;
    const { result, fallback } = await runDeepSeekAgent({
      message: "I work on a construction site",
      lang: "en",
      intent: "question",
    });

    expect(fallback).toBe(true);
    expect(result.sector).toBe("construction");
    expect(result.intent).toBe("question");
    expect(result.reviewStatus).toBe("insufficient-information");
    expect(result.sourceIds).toEqual([]);
  });

  it("respects an explicitly provided sector", async () => {
    delete process.env.DEEPSEEK_API_KEY;
    const { result } = await runDeepSeekAgent({
      message: "something unrelated",
      lang: "sw",
      intent: "concern",
      sector: "domestic",
    });

    expect(result.sector).toBe("domestic");
    expect(result.intent).toBe("concern");
  });

  it("treats the placeholder key as unconfigured", async () => {
    process.env.DEEPSEEK_API_KEY = "your_deepseek_api_key_here";
    const { fallback } = await runDeepSeekAgent({
      message: "I pick tea",
      lang: "en",
      intent: "question",
    });

    expect(fallback).toBe(true);
  });
});
