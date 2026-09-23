import { describe, expect, it } from "vitest";
import { normalizeKenyanPhone } from "@/utils/supabase/recovery";

describe("normalizeKenyanPhone", () => {
  it("normalizes common Kenyan mobile formats to E.164", () => {
    expect(normalizeKenyanPhone("0712 345 678")).toBe("+254712345678");
    expect(normalizeKenyanPhone("254 701 234 567")).toBe("+254701234567");
  });

  it("preserves valid international numbers and rejects incomplete numbers", () => {
    expect(normalizeKenyanPhone("+1 (415) 555-2671")).toBe("+14155552671");
    expect(normalizeKenyanPhone("0712 34")).toBeNull();
  });
});
