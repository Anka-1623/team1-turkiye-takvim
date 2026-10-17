import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ageTurning,
  currentAge,
  daysUntilNextBirthday,
  istanbulToday,
  nextOccurrenceYear,
} from "./date";

/** A "today" the way the app sees it: UTC midnight of the Istanbul calendar date. */
const day = (year: number, month: number, date: number) => new Date(Date.UTC(year, month - 1, date));

describe("daysUntilNextBirthday", () => {
  it("is 0 on the birthday itself", () => {
    expect(daysUntilNextBirthday("2000-10-12", day(2026, 10, 12))).toBe(0);
  });

  it("counts the days to a birthday later this year", () => {
    expect(daysUntilNextBirthday("2000-10-12", day(2026, 10, 5))).toBe(7);
    expect(daysUntilNextBirthday("2000-10-12", day(2026, 10, 9))).toBe(3);
  });

  it("rolls over to next year once the birthday has passed", () => {
    expect(daysUntilNextBirthday("2000-10-11", day(2026, 10, 12))).toBe(364);
    // 2028 is a leap year, so Feb 29 sits between these two dates.
    expect(daysUntilNextBirthday("2000-10-11", day(2027, 10, 12))).toBe(365);
  });

  it("crosses the new year", () => {
    expect(daysUntilNextBirthday("2000-01-02", day(2026, 12, 30))).toBe(3);
    expect(daysUntilNextBirthday("2000-01-01", day(2026, 12, 31))).toBe(1);
  });

  it("moves a Feb 29 birthday to Mar 1 in non-leap years", () => {
    expect(daysUntilNextBirthday("2000-02-29", day(2027, 2, 27))).toBe(2); // Mar 1, 2027
    expect(daysUntilNextBirthday("2000-02-29", day(2027, 3, 1))).toBe(0);
  });

  it("keeps a Feb 29 birthday on Feb 29 in leap years", () => {
    expect(daysUntilNextBirthday("2000-02-29", day(2028, 2, 27))).toBe(2); // Feb 29, 2028
    expect(daysUntilNextBirthday("2000-02-29", day(2028, 2, 29))).toBe(0);
  });
});

describe("nextOccurrenceYear", () => {
  it("is this year until the birthday has passed", () => {
    expect(nextOccurrenceYear("2000-10-12", day(2026, 10, 12))).toBe(2026);
    expect(nextOccurrenceYear("2000-12-31", day(2026, 10, 12))).toBe(2026);
  });

  it("is next year after it, and for early-January birthdays at the end of December", () => {
    expect(nextOccurrenceYear("2000-10-11", day(2026, 10, 12))).toBe(2027);
    expect(nextOccurrenceYear("2000-01-02", day(2026, 12, 30))).toBe(2027);
  });
});

describe("age", () => {
  it("ageTurning is the age reached on the next birthday", () => {
    expect(ageTurning("2000-10-12", day(2026, 10, 12))).toBe(26);
    expect(ageTurning("2000-10-12", day(2026, 10, 13))).toBe(27);
  });

  it("currentAge has already turned on the birthday itself, not before", () => {
    expect(currentAge("2000-10-12", day(2026, 10, 11))).toBe(25);
    expect(currentAge("2000-10-12", day(2026, 10, 12))).toBe(26);
    expect(currentAge("2000-10-12", day(2026, 10, 13))).toBe(26);
  });
});

describe("istanbulToday", () => {
  afterEach(() => vi.useRealTimers());

  it("uses the Istanbul calendar date, not UTC's", () => {
    // 22:30 UTC on Oct 12 is already 01:30 on Oct 13 in Istanbul (UTC+3, no DST).
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-12T22:30:00Z"));
    expect(istanbulToday().toISOString()).toBe("2026-10-13T00:00:00.000Z");
  });

  it("runs the daily 05:00 UTC cron on the same Istanbul date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-13T05:00:00Z")); // 08:00 in Istanbul
    expect(istanbulToday().toISOString()).toBe("2026-10-13T00:00:00.000Z");
    expect(daysUntilNextBirthday("2000-10-13")).toBe(0);
  });
});
