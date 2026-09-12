// Berlin, not UTC — the site's primary audience is German, and the ingest
// workflow runs on UTC cron slots throughout the day, so anchoring to UTC
// would shift the day/week boundary by up to two hours from the local
// calendar.

function berlinTodayUtcMidnight(): Date {
  const berlinToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());
  const [y, m, d] = berlinToday.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Returns the Monday–Sunday week boundaries (Berlin calendar) of a
 * previous, fully-completed week — `weeksAgo=0` is the most recently
 * completed week, `weeksAgo=1` the one before that, etc. A completed week
 * (rather than a rolling "last 7 days" or the still-in-progress current
 * week) reads as a stable, comparable period instead of one that keeps
 * shifting or is partially empty. */
export function weekRangeInBerlin(weeksAgo: number): { from: string; to: string } {
  const today = berlinTodayUtcMidnight();
  const isoWeekday = today.getUTCDay() || 7; // Mon=1 ... Sun=7
  const lastMonday = new Date(today);
  lastMonday.setUTCDate(today.getUTCDate() - (isoWeekday - 1) - 7 - weeksAgo * 7);
  const lastSunday = new Date(lastMonday);
  lastSunday.setUTCDate(lastMonday.getUTCDate() + 6);
  const iso = (dt: Date) => dt.toISOString().slice(0, 10);
  return { from: iso(lastMonday), to: iso(lastSunday) };
}

/** Berlin-calendar date `daysAgo` days before today (0 = today) — for a
 * rolling N-day window use `daysAgoInBerlin(N - 1)` as the "from" bound. */
export function daysAgoInBerlin(daysAgo: number): string {
  const date = berlinTodayUtcMidnight();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}
