import { describe, expect, it } from "vitest";
import {
  SECTOR_CONFIGS,
  SECTOR_IDS,
  calculateSectorAudit,
  getSectorConfig,
  isKenyanSector,
  parseHoursBetween,
  type KenyanSector,
} from "./legal-engine";

describe("parseHoursBetween", () => {
  it("computes a normal same-day shift", () => {
    expect(parseHoursBetween("08:00", "16:00")).toBe(8);
  });

  it("computes fractional hours", () => {
    expect(parseHoursBetween("09:30", "17:15")).toBe(7.75);
  });

  it("handles a cross-midnight shift", () => {
    expect(parseHoursBetween("20:00", "04:00")).toBe(8);
  });

  it("returns 0 for missing or invalid input", () => {
    expect(parseHoursBetween("", "16:00")).toBe(0);
    expect(parseHoursBetween("08:00", "")).toBe(0);
    expect(parseHoursBetween("not-a-time", "16:00")).toBe(0);
  });

  it("returns 0 when start equals end", () => {
    expect(parseHoursBetween("08:00", "08:00")).toBe(0);
  });
});

describe("SECTOR_IDS", () => {
  it("covers corporate and low-wage categories plus a freeform bucket", () => {
    expect(SECTOR_IDS).toContain("office_professional");
    expect(SECTOR_IDS).toContain("retail_hospitality");
    expect(SECTOR_IDS).toContain("security");
    expect(SECTOR_IDS).toContain("healthcare_care");
    expect(SECTOR_IDS).toContain("other");
  });

  it("has a matching config for every id", () => {
    for (const id of SECTOR_IDS) {
      const config = SECTOR_CONFIGS[id];
      expect(config.id).toBe(id);
      expect(config.name.length).toBeGreaterThan(0);
      expect(config.statutoryCitations.length).toBeGreaterThan(0);
    }
  });
});

describe("isKenyanSector", () => {
  it("accepts known ids and rejects anything else", () => {
    expect(isKenyanSector("office_professional")).toBe(true);
    expect(isKenyanSector("other")).toBe(true);
    expect(isKenyanSector("wizardry")).toBe(false);
    expect(isKenyanSector(42)).toBe(false);
  });
});

describe("getSectorConfig", () => {
  it("falls back to the freeform config for an unknown value", () => {
    expect(getSectorConfig("unknown" as KenyanSector).id).toBe("other");
  });
});

describe("calculateSectorAudit", () => {
  it("reports no claim for a fully paid standard day", () => {
    const result = calculateSectorAudit("construction", 1200, 1200, "08:00", "16:00", false);
    expect(result.totalHours).toBe(8);
    expect(result.overtimeHours).toBe(0);
    expect(result.wageDeficit).toBe(0);
    expect(result.overtimePayDue).toBe(0);
    expect(result.totalClaim).toBe(0);
    expect(result.reviewStatus).toBe("recorded");
  });

  it("computes the unpaid agreed amount as a wage deficit", () => {
    const result = calculateSectorAudit("construction", 1200, 1000, "08:00", "16:00", false);
    expect(result.wageDeficit).toBe(200);
    expect(result.overtimePayDue).toBe(0);
    expect(result.totalClaim).toBe(200);
  });

  it("applies the 1.5x multiplier to overtime on a normal day", () => {
    const result = calculateSectorAudit("construction", 1200, 1200, "08:00", "18:00", false);
    expect(result.totalHours).toBe(10);
    expect(result.overtimeHours).toBe(2);
    expect(result.hourlyRate).toBe(150);
    expect(result.overtimePayDue).toBe(450);
    expect(result.totalClaim).toBe(450);
    expect(result.reviewStatus).toBe("needs-review");
  });

  it("applies the 2.0x multiplier on a Sunday or public holiday", () => {
    const result = calculateSectorAudit("construction", 1200, 1200, "08:00", "18:00", true);
    expect(result.overtimePayDue).toBe(600);
  });

  it("derives the hourly rate from the entered pay, not a statutory figure", () => {
    const result = calculateSectorAudit("construction", 1600, 1600, "08:00", "16:00", false);
    expect(result.hourlyRate).toBe(200);
  });

  it("returns zero overtime when no agreed pay is entered", () => {
    const result = calculateSectorAudit("domestic", 0, 0, "08:00", "18:00", false);
    expect(result.hourlyRate).toBe(0);
    expect(result.overtimePayDue).toBe(0);
  });

  it("does not apply a minimum-wage comparison for a low agreed price", () => {
    const result = calculateSectorAudit("construction", 300, 300, "08:00", "16:00", false);
    expect(result.wageDeficit).toBe(0);
    expect(result.totalClaim).toBe(0);
    expect(result.reviewStatus).toBe("recorded");
  });

  it("works for the new corporate and low-wage categories", () => {
    const office = calculateSectorAudit("office_professional", 800, 800, "09:00", "19:00", false);
    expect(office.sectorName).toBe(SECTOR_CONFIGS.office_professional.name);
    expect(office.overtimeHours).toBe(2);
    const security = calculateSectorAudit("security", 600, 500, "18:00", "02:00", false);
    expect(security.totalHours).toBe(8);
    expect(security.wageDeficit).toBe(100);
  });

  it("falls back to the freeform config for an unknown sector", () => {
    const result = calculateSectorAudit("unknown" as KenyanSector, 1000, 1000, "08:00", "16:00", false);
    expect(result.sectorName).toBe(SECTOR_CONFIGS.other.name);
  });

  it("always returns four auditable line items", () => {
    const result = calculateSectorAudit("agriculture", 950, 900, "07:00", "17:00", false);
    expect(result.lineItems.map((item) => item.id)).toEqual([
      "agreed-pay",
      "payment-received",
      "payment-gap",
      "overtime-estimate",
    ]);
  });
});
