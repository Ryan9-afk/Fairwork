import { describe, expect, it } from "vitest";
import {
  SECTOR_CONFIGS,
  calculateSectorAudit,
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

describe("SECTOR_CONFIGS", () => {
  it("defines every supported sector with a positive baseline", () => {
    const sectors: KenyanSector[] = ["construction", "agriculture", "domestic", "gig_delivery"];
    for (const sector of sectors) {
      expect(SECTOR_CONFIGS[sector].dailyMinimumBaseline).toBeGreaterThan(0);
      expect(SECTOR_CONFIGS[sector].statutoryCitations.length).toBeGreaterThan(0);
    }
  });

  it("uses statutory overtime multipliers", () => {
    for (const config of Object.values(SECTOR_CONFIGS)) {
      expect(config.normalOvertimeMultiplier).toBe(1.5);
      expect(config.restDayOvertimeMultiplier).toBe(2.0);
    }
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
    expect(result.isMinimumWageShortfall).toBe(false);
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

  it("derives the hourly rate from the entered pay, not the baseline", () => {
    const result = calculateSectorAudit("construction", 1600, 1600, "08:00", "16:00", false);
    expect(result.hourlyRate).toBe(200);
  });

  it("falls back to the sector baseline when agreed pay is zero", () => {
    const result = calculateSectorAudit("domestic", 0, 0, "08:00", "16:00", false);
    expect(result.hourlyRate).toBe(SECTOR_CONFIGS.domestic.dailyMinimumBaseline / 8);
  });

  it("flags agreed pay below the statutory baseline", () => {
    const result = calculateSectorAudit("construction", 1000, 1000, "08:00", "16:00", false);
    expect(result.isMinimumWageShortfall).toBe(true);
    expect(result.reviewStatus).toBe("needs-review");
  });

  it("falls back to construction for an unknown sector", () => {
    const result = calculateSectorAudit("unknown" as KenyanSector, 1200, 1200, "08:00", "16:00", false);
    expect(result.sectorName).toBe(SECTOR_CONFIGS.construction.name);
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
