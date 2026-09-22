import { describe, expect, it } from "vitest";
import {
  PAYMENT_BASES,
  createArrangementId,
  createWorkArrangement,
  routeSectorFromText,
} from "./work-arrangements";

describe("routeSectorFromText", () => {
  it.each([
    ["I work at a construction site as a mason", "construction"],
    ["I pick tea on a farm each morning", "agriculture"],
    ["I am a househelp for a family in Nairobi", "domestic"],
    ["I ride a boda boda and deliver for Bolt", "gig_delivery"],
  ] as const)("routes %j to %s", (text, sector) => {
    expect(routeSectorFromText(text)).toBe(sector);
  });

  it("returns null when no sector keyword is present", () => {
    expect(routeSectorFromText("hello, I have a question")).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(routeSectorFromText("MJENGO FUNDI")).toBe("construction");
  });
});

describe("createWorkArrangement", () => {
  it("applies safe defaults", () => {
    const arrangement = createWorkArrangement();
    expect(arrangement.sector).toBe("construction");
    expect(arrangement.paymentBasis).toBe("unsure");
    expect(arrangement.confirmed).toBe(false);
    expect(arrangement.customFields).toEqual({});
    expect(arrangement.id).toBeTruthy();
  });

  it("preserves provided values", () => {
    const arrangement = createWorkArrangement({ label: "Tea estate", sector: "agriculture", confirmed: true });
    expect(arrangement.label).toBe("Tea estate");
    expect(arrangement.sector).toBe("agriculture");
    expect(arrangement.confirmed).toBe(true);
  });
});

describe("createArrangementId", () => {
  it("generates unique ids", () => {
    expect(createArrangementId()).not.toBe(createArrangementId());
  });
});

describe("PAYMENT_BASES", () => {
  it("exposes the supported payment bases", () => {
    expect(PAYMENT_BASES).toContain("daily");
    expect(PAYMENT_BASES).toContain("unsure");
  });
});
