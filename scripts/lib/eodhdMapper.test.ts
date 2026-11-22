import { test } from "node:test";
import assert from "node:assert/strict";
import { mapAnalysts, mapBars, mapFundamentals, mapGeneral, num } from "./eodhdMapper";

// Shape follows EODHD's fundamentals response when several `filter`
// sections are requested (flat "A::B::C" keys) — values partly as strings.
const fixture = {
  General: { Code: "SAP", Name: "SAP SE", ISIN: "DE0007164600", LEI: "529900D6BF99LW9R2E68", CurrencyCode: "EUR", CountryISO: "DE", Sector: "Technology", Industry: "Software—Application", Exchange: "XETRA" },
  Highlights: {
    MarketCapitalization: 300_000_000_000,
    PERatio: "45.2",
    PEGRatio: "2.1",
    DividendYield: 0.009,
    ProfitMargin: 0.19,
    OperatingMarginTTM: "0.27",
    ReturnOnEquityTTM: 0.16,
    ReturnOnAssetsTTM: 0.08,
    QuarterlyRevenueGrowthYOY: 0.1,
    QuarterlyEarningsGrowthYOY: 0.3,
    EPSEstimateCurrentYear: 6,
    EPSEstimateNextYear: 7.2,
    WallStreetTargetPrice: 290,
  },
  Valuation: { TrailingPE: 45.2, ForwardPE: "33.1", PriceSalesTTM: 8.4, PriceBookMRQ: 6.9, EnterpriseValueEbitda: 0 },
  AnalystRatings: { Rating: 4.5, TargetPrice: 300, StrongBuy: 20, Buy: 8, Hold: 3, Sell: 0, StrongSell: 1 },
  "Financials::Balance_Sheet::yearly": {
    "2025-12-31": { date: "2025-12-31", totalStockholderEquity: "45000000000", shortLongTermDebtTotal: "9000000000", totalCurrentAssets: "25000000000", totalCurrentLiabilities: "20000000000" },
    "2024-12-31": { date: "2024-12-31", totalStockholderEquity: "40000000000" },
  },
  "Financials::Cash_Flow::yearly": { "2025-12-31": { date: "2025-12-31", freeCashFlow: "6000000000" } },
  "Financials::Income_Statement::yearly": {
    "2025-12-31": { date: "2025-12-31", totalRevenue: "36000000000" },
    "2024-12-31": { date: "2024-12-31", totalRevenue: "34000000000" },
    "2023-12-31": { date: "2023-12-31", totalRevenue: "31000000000" },
    "2022-12-31": { date: "2022-12-31", totalRevenue: "29000000000" },
  },
};

test("num handles EODHD's missing-value spellings", () => {
  assert.equal(num("12.5"), 12.5);
  assert.equal(num("NA"), null);
  assert.equal(num(null), null);
  assert.equal(num(""), null);
});

test("mapGeneral", () => {
  const g = mapGeneral(fixture);
  assert.equal(g.isin, "DE0007164600");
  assert.equal(g.currency, "EUR");
  assert.equal(g.sector, "Technology");
});

test("mapFundamentals derives ratios from statements", () => {
  const f = mapFundamentals(fixture);
  assert.ok(f);
  assert.equal(f.forwardPE, 33.1);
  assert.equal(f.evToEbitda, null); // 0 = nicht verfügbar
  assert.equal(f.operatingMargin, 0.27);
  assert.equal(f.debtToEquity, 0.2);
  assert.equal(f.currentRatio, 1.25);
  assert.equal(f.fcfYield, 0.02);
  assert.ok(Math.abs((f.epsGrowthNextYear as number) - 0.2) < 1e-9);
  assert.ok(Math.abs((f.revenueCagr3y as number) - ((36 / 29) ** (1 / 3) - 1)) < 1e-9);
});

test("mapFundamentals also accepts the nested shape", () => {
  const nested = {
    Highlights: fixture.Highlights,
    Valuation: fixture.Valuation,
    Financials: { Balance_Sheet: { yearly: fixture["Financials::Balance_Sheet::yearly"] } },
  };
  assert.equal(mapFundamentals(nested)?.debtToEquity, 0.2);
});

test("mapAnalysts", () => {
  const a = mapAnalysts(fixture);
  assert.deepEqual(a, { strongBuy: 20, buy: 8, hold: 3, sell: 0, strongSell: 1, targetPrice: 300 });
  assert.equal(mapAnalysts({ AnalystRatings: { StrongBuy: 0, Buy: 0, Hold: 0, Sell: 0, StrongSell: 0, TargetPrice: 0 } }), null);
});

test("mapBars applies the split adjustment to OHLC", () => {
  const bars = mapBars([
    { date: "2026-01-02", open: 200, high: 210, low: 190, close: 200, adjusted_close: 100, volume: 5 },
    { date: "2026-01-05", open: 0, high: 0, low: 0, close: 0, adjusted_close: 0, volume: 0 },
  ]);
  assert.equal(bars.length, 1);
  assert.deepEqual(bars[0], { date: "2026-01-02", open: 100, high: 105, low: 95, close: 100, volume: 5 });
});
