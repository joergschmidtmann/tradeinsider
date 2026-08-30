// Weekly "most traded" / "most shorted" US-stock rankings for the Aktien tab
// on /trading-intelligence, built from two free, key-free public sources:
//
// - FINRA's daily Reg SHO "Consolidated" short sale volume files
//   (cdn.finra.org) — per-symbol short volume vs. total volume, posted once
//   per trading day.
// - Nasdaq Trader's symbol directory (nasdaqtrader.com) — security names and
//   an ETF flag, used to keep this list to individual stocks (ETFs get their
//   own tab) and to drop test-only ticker symbols (e.g. ZVZZT).
//
// Important nuance to keep in mind wherever this is displayed: FINRA's daily
// "short volume" measures trades *executed* that day and marked as short —
// it is NOT the same thing as "short interest" (total open short positions,
// which FINRA only publishes twice a month with a multi-day lag). A high
// short-volume ratio often just reflects normal market-maker/hedging
// activity in a heavily-traded name, not bearish conviction — this is a
// trading-activity ranking, not a "everyone is betting against this stock"
// signal.
const FINRA_BASE = "https://cdn.finra.org/equity/regsho/daily";
const NASDAQ_LISTED_URL = "https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt";
const OTHER_LISTED_URL = "https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt";
const REVALIDATE_SECONDS = 6 * 60 * 60; // both sources only update once per trading day
const TARGET_TRADING_DAYS = 5;
const CANDIDATE_WEEKDAYS = 10; // buffer for holidays and today's file not posted yet
const MIN_WEEKLY_VOLUME = 500_000; // keeps illiquid noise out of the short-ratio ranking

interface SecurityInfo {
  name: string;
  isEtf: boolean;
  isTestIssue: boolean;
}

interface DailyVolume {
  shortVolume: number;
  totalVolume: number;
}

export interface RankedStock {
  symbol: string;
  name: string;
  totalVolume: number;
  shortVolume: number;
  shortRatio: number; // 0-100
}

export interface WeeklyStockRankings {
  mostTraded: RankedStock[];
  mostShorted: RankedStock[];
  tradingDays: number;
}

function parseDirectoryFile(text: string, columns: { symbol: number; name: number; etf: number; testIssue: number }): [string, SecurityInfo][] {
  return text
    .split("\n")
    .slice(1)
    .map((line) => line.split("|"))
    .filter((cols) => cols.length >= 6 && cols[columns.symbol])
    .map((cols) => [
      cols[columns.symbol],
      {
        name: cols[columns.name].trim(),
        isEtf: cols[columns.etf] === "Y",
        isTestIssue: cols[columns.testIssue] === "Y",
      },
    ]);
}

async function fetchSecurityDirectory(): Promise<Map<string, SecurityInfo>> {
  const [nasdaqRes, otherRes] = await Promise.all([
    fetch(NASDAQ_LISTED_URL, { next: { revalidate: REVALIDATE_SECONDS } }),
    fetch(OTHER_LISTED_URL, { next: { revalidate: REVALIDATE_SECONDS } }),
  ]);
  const map = new Map<string, SecurityInfo>();
  // "Symbol|Security Name|Market Category|Test Issue|Financial Status|Round Lot Size|ETF|NextShares"
  if (nasdaqRes.ok) {
    for (const [symbol, info] of parseDirectoryFile(await nasdaqRes.text(), { symbol: 0, name: 1, testIssue: 3, etf: 6 })) {
      map.set(symbol, info);
    }
  }
  // "ACT Symbol|Security Name|Exchange|CQS Symbol|ETF|Round Lot Size|Test Issue|NASDAQ Symbol"
  if (otherRes.ok) {
    for (const [symbol, info] of parseDirectoryFile(await otherRes.text(), { symbol: 0, name: 1, etf: 4, testIssue: 6 })) {
      if (!map.has(symbol)) map.set(symbol, info);
    }
  }
  return map;
}

function parseShortVolumeFile(text: string): Map<string, DailyVolume> {
  const map = new Map<string, DailyVolume>();
  for (const line of text.split("\n").slice(1)) {
    // "Date|Symbol|ShortVolume|ShortExemptVolume|TotalVolume|Market"
    const cols = line.split("|");
    if (cols.length < 5 || !cols[1]) continue;
    map.set(cols[1], { shortVolume: Number(cols[2]) || 0, totalVolume: Number(cols[4]) || 0 });
  }
  return map;
}

function formatFinraDate(d: Date): string {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
}

function getRecentWeekdays(count: number): Date[] {
  const days: Date[] = [];
  const cursor = new Date();
  while (days.length < count) {
    const dow = cursor.getUTCDay();
    if (dow !== 0 && dow !== 6) days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return days;
}

async function fetchShortVolumeForDate(d: Date): Promise<Map<string, DailyVolume> | null> {
  const res = await fetch(`${FINRA_BASE}/CNMSshvol${formatFinraDate(d)}.txt`, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) return null;
  return parseShortVolumeFile(await res.text());
}

async function getRecentTradingDayFiles(): Promise<Map<string, DailyVolume>[]> {
  const results = await Promise.all(getRecentWeekdays(CANDIDATE_WEEKDAYS).map(fetchShortVolumeForDate));
  return results.filter((r): r is Map<string, DailyVolume> => r !== null).slice(0, TARGET_TRADING_DAYS);
}

export async function getWeeklyStockRankings(): Promise<WeeklyStockRankings | null> {
  try {
    const [directory, dailyFiles] = await Promise.all([fetchSecurityDirectory(), getRecentTradingDayFiles()]);
    if (dailyFiles.length === 0) return null;

    const totals = new Map<string, DailyVolume>();
    for (const day of dailyFiles) {
      for (const [symbol, row] of day) {
        const info = directory.get(symbol);
        if (!info || info.isEtf || info.isTestIssue) continue;
        const acc = totals.get(symbol) ?? { shortVolume: 0, totalVolume: 0 };
        acc.shortVolume += row.shortVolume;
        acc.totalVolume += row.totalVolume;
        totals.set(symbol, acc);
      }
    }

    const ranked: RankedStock[] = [...totals.entries()].map(([symbol, v]) => ({
      symbol,
      name: directory.get(symbol)?.name ?? symbol,
      totalVolume: v.totalVolume,
      shortVolume: v.shortVolume,
      shortRatio: v.totalVolume > 0 ? (v.shortVolume / v.totalVolume) * 100 : 0,
    }));

    return {
      mostTraded: [...ranked].sort((a, b) => b.totalVolume - a.totalVolume).slice(0, 20),
      mostShorted: ranked
        .filter((r) => r.totalVolume >= MIN_WEEKLY_VOLUME)
        .sort((a, b) => b.shortRatio - a.shortRatio)
        .slice(0, 20),
      tradingDays: dailyFiles.length,
    };
  } catch {
    return null;
  }
}
