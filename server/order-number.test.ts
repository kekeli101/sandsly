import { describe, expect, it } from "vitest";
import { formatDailyOrderNumber, getGhanaOrderDateKey, getNextDailyOrderSequence } from "./db";

describe("daily order numbers", () => {
  it("uses the Ghana calendar date for the date key", () => {
    expect(getGhanaOrderDateKey(new Date("2026-08-28T00:30:00.000Z"))).toBe("20260828");
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
