const MS_PER_DAY = 86_400_000;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Today's wall-clock date in Europe/Istanbul, as a UTC midnight Date. */
export function istanbulToday(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = Number(parts.find((p) => p.type === "year")!.value);
  const m = Number(parts.find((p) => p.type === "month")!.value);
  const d = Number(parts.find((p) => p.type === "day")!.value);
  return new Date(Date.UTC(y, m - 1, d));
}

function parseBirthday(birthday: string): { year: number; month: number; day: number } {
  const [y, m, d] = birthday.split("-").map(Number);
  return { year: y, month: m, day: d };
}

function nextOccurrenceDate(birthday: string, today: Date): Date {
  const { month, day } = parseBirthday(birthday);

  const occursIn = (year: number): Date => {
    if (month === 2 && day === 29 && !isLeapYear(year)) {
      return new Date(Date.UTC(year, 2, 1)); // March 1st
    }
    return new Date(Date.UTC(year, month - 1, day));
  };

  const thisYear = today.getUTCFullYear();
  let next = occursIn(thisYear);
  if (next.getTime() < today.getTime()) {
    next = occursIn(thisYear + 1);
  }
  return next;
}

/** Days until the next occurrence of this birthday (0 = today). Feb 29 falls back to Mar 1 on non-leap years. */
export function daysUntilNextBirthday(birthday: string, today: Date = istanbulToday()): number {
  const next = nextOccurrenceDate(birthday, today);
  return Math.round((next.getTime() - today.getTime()) / MS_PER_DAY);
}

/** The calendar year the next occurrence of this birthday falls in — used to dedupe milestone notifications per year. */
export function nextOccurrenceYear(birthday: string, today: Date = istanbulToday()): number {
  return nextOccurrenceDate(birthday, today).getUTCFullYear();
}

/** The age the member turns on their next birthday, if a birth year was given. */
export function ageTurning(birthday: string, today: Date = istanbulToday()): number {
  const { year } = parseBirthday(birthday);
  return nextOccurrenceDate(birthday, today).getUTCFullYear() - year;
}

export function formatBirthdayLong(birthday: string): string {
  const { month, day } = parseBirthday(birthday);
  const d = new Date(Date.UTC(2000, month - 1, day));
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", timeZone: "UTC" }).format(d);
}

export function daysUntilLabel(days: number): string {
  if (days === 0) return "Bugün";
  if (days === 1) return "Yarın";
  return `${days} gün sonra`;
}
