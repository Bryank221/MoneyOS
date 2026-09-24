import { describe, expect, it } from "vitest";
import { formatMoney, formatSignedMoney, majorToMinor, minorToMajor } from "./money";

describe("minor/major conversion", () => {
  it("converts minor units to major", () => {
    expect(minorToMajor(1850)).toBe(18.5);
  });

  it("converts major units to minor, rounding to whole cents", () => {
    expect(majorToMinor(18.5)).toBe(1850);
    expect(majorToMinor(18.505)).toBe(1851);
  });
});

describe("formatMoney", () => {
  it("formats MYR with the RM symbol", () => {
    expect(formatMoney(1850)).toBe("RM18.50");
  });

  it("formats negative amounts", () => {
    expect(formatMoney(-1850)).toBe("-RM18.50");
  });
});

describe("formatSignedMoney", () => {
  it("prefixes a plus sign for positive amounts", () => {
    expect(formatSignedMoney(1850)).toBe("+RM18.50");
  });

  it("prefixes a minus sign for negative amounts", () => {
    expect(formatSignedMoney(-1850)).toBe("-RM18.50");
  });

  it("has no sign for zero", () => {
    expect(formatSignedMoney(0)).toBe("RM0.00");
  });
});
