import { describe, expect, it } from "vitest";
import { dueMilestone } from "./milestone";

describe("dueMilestone", () => {
  it("fires on the milestone days", () => {
    expect(dueMilestone(7)).toBe(7);
    expect(dueMilestone(3)).toBe(3);
    expect(dueMilestone(0)).toBe(0);
  });

  it("gives a missed heads-up one more day", () => {
    expect(dueMilestone(6)).toBe(7);
    expect(dueMilestone(2)).toBe(3);
  });

  it("stays quiet on every other day", () => {
    for (const days of [1, 4, 5, 8, 30, 364]) {
      expect(dueMilestone(days)).toBeNull();
    }
  });

  it("gives the day itself no second chance", () => {
    expect(dueMilestone(-1)).toBeNull();
  });
});
