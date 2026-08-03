import { describe, expect, it } from "vitest";
import { formatMoney } from "./money";

describe("formatMoney", () => {
  it("shows the currency code", () => expect(formatMoney("1250.50", "XOF", "en")).toContain("XOF"));
  it("rejects numbers instead of decimal strings", () => expect(() => formatMoney("12e3", "USD")).toThrow());
});
