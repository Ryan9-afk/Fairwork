import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createDossierPdf, dossierFilename } from "./dossier-pdf";

describe("dossier export", () => {
  it("creates a paginated PDF with embedded font for long records", () => {
    const font = readFileSync("public/fonts/geist-latin.ttf").toString("base64");
    const pdf = createDossierPdf({ shifts: [], evidence: [], arrangements: [], profile: null, includePersonal: false, isDemoMode: true,
      incidents: [{ id: 1, date: "2026-09-23", category: "general", description: "A long workplace incident, with witnesses and supporting details. ".repeat(400), evidenceIds: [], createdAt: "2026-09-23" }],
    }, font);
    expect(pdf.getNumberOfPages()).toBeGreaterThan(3);
    expect(pdf.output().startsWith("%PDF-")).toBe(true);
    expect(pdf.output("arraybuffer").byteLength).toBeGreaterThan(10000);
  });
  it("sanitizes names and distinguishes repeated exports", () => {
    const date = new Date("2026-09-23T12:00:00.000Z");
    expect(dossierFilename("my:claim.pdf", date)).toBe("my-claim-2026-09-23T12-00-00-000Z.pdf");
    expect(dossierFilename("", date)).toContain("Haki-Dossier-");
    expect(dossierFilename("claim", date)).not.toBe(dossierFilename("claim", new Date(date.getTime() + 1)));
  });
});
