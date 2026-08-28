import { describe, expect, it } from "vitest";
import { formatDailyOrderNumber, getGhanaDayRange, getGhanaOrderDateKey, getNextDailyOrderSequence } from "./db";

describe("daily order numbers", () => {
  it("uses the Ghana calendar date for the date key", () => {
    expect(getGhanaOrderDateKey(new Date("2026-08-28T00:30:00.000Z"))).toBe("20260828");
  });

  it("builds an inclusive Ghana-local day range with an exclusive next-day boundary", () => {
    const range = getGhanaDayRange("2026-08-28");
    expect(range?.start.toISOString()).toBe("2026-08-28T00:00:00.000Z");
    expect(range?.end.toISOString()).toBe("2026-08-29T00:00:00.000Z");
  });

  it("rejects malformed and impossible calendar dates", () => {
    expect(() => getGhanaDayRange("2026-08")).toThrow(/YYYY-MM-DD/);
    expect(() => getGhanaDayRange("2026-02-30")).toThrow(/valid calendar date/);
  });

  it("formats a padded daily sequence with the Crunch Bite prefix", () => {
    expect(formatDailyOrderNumber("20260828", 1)).toBe("CB-20260828-001");
    expect(formatDailyOrderNumber("20260828", 12)).toBe("CB-20260828-012");
    expect(formatDailyOrderNumber("20260828", 1000)).toBe("CB-20260828-1000");
  });

  it("selects the next sequence only from the requested day", () => {
    expect(getNextDailyOrderSequence([
      "CB-20260828-001",
      "CB-20260828-010",
      "CB-20260827-999",
      "CB-12345678-321",
      "CB-20260828-invalid",
    ], "20260828")).toBe(11);
  });

  it("starts a new day at one when no matching order exists", () => {
    expect(getNextDailyOrderSequence(["CB-20260827-004"], "20260828")).toBe(1);
  });
});
