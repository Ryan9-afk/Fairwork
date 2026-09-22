import { describe, expect, it } from "vitest";
import { SECTOR_AGENT_CONFIGS, buildSectorSystemPrompt, getSectorAgentConfig } from "./sector-agents";
import type { KenyanSector } from "./legal-engine";

describe("buildSectorSystemPrompt", () => {
  it("joins each instruction with a real newline", () => {
    const prompt = buildSectorSystemPrompt("construction", "question");
    expect(prompt).toContain("\n");
    expect(prompt).not.toContain("\\n");
  });

  it("lists the sector's name and allowed source IDs", () => {
    const prompt = buildSectorSystemPrompt("agriculture", "setup");
    expect(prompt).toContain(SECTOR_AGENT_CONFIGS.agriculture.name);
    for (const sourceId of SECTOR_AGENT_CONFIGS.agriculture.sourceIds) {
      expect(prompt).toContain(sourceId);
    }
  });

  it("produces one non-empty instruction per line", () => {
    const lines = buildSectorSystemPrompt("domestic", "concern").split("\n");
    expect(lines.length).toBeGreaterThan(8);
    expect(lines.every((line) => line.length > 0)).toBe(true);
  });

  it("carries the requested intent", () => {
    expect(buildSectorSystemPrompt("gig_delivery", "document")).toContain("document");
  });
});

describe("getSectorAgentConfig", () => {
  it("returns the matching config for every sector", () => {
    for (const sector of Object.keys(SECTOR_AGENT_CONFIGS) as KenyanSector[]) {
      expect(getSectorAgentConfig(sector).sector).toBe(sector);
    }
  });
});
