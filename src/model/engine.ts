/**
 * FORECAST ENGINE — a 1:1 port of the workbook formulas.
 * Forecast_Model!D13:F30 and Historical_Data!C13:D23. Pure functions; no UI.
 */
import { HISTORICAL, HIST_YEARS, FORECAST_YEARS, type ScenarioAssumptions } from "./data";

export interface Row {
  year: string;
  isForecast: boolean;
  revenue: number;
  revenueGrowth: number | null;
  ebitda: number;
  ebitdaMargin: number;
  depreciation: number;
  ebit: number;
  ebitMargin: number;
  tax: number | null; // forecast only (historical tax not in source)
  netProfit: number;
  netMargin: number;
  eps: number;
  capex: number;
  fcf: number;
  fcfMargin: number;
  otherIncome: number | null;
  employees: number | null;
  shares: number;
}

export const cagr = (end: number, start: number, years: number) => Math.pow(end / start, 1 / years) - 1;
export const growth = (cur: number, prev: number) => (cur - prev) / prev;

/** Historical rows (immutable actuals). FCF = NP + Depr − Capex (Historical_Data row 18). */
export function historicalRows(): Row[] {
  const h = HISTORICAL;
  return HIST_YEARS.map((year, i) => {
    const fcf = h.netProfit[i]! + h.depreciation[i]! - h.capex[i]!;
    return {
      year,
      isForecast: false,
      revenue: h.revenue[i]!,
      revenueGrowth: i === 0 ? null : growth(h.revenue[i]!, h.revenue[i - 1]!),
      ebitda: h.ebitda[i]!,
      ebitdaMargin: h.ebitda[i]! / h.revenue[i]!,
      depreciation: h.depreciation[i]!,
      ebit: h.ebit[i]!,
      ebitMargin: h.ebit[i]! / h.revenue[i]!,
      tax: null,
      netProfit: h.netProfit[i]!,
      netMargin: h.netProfit[i]! / h.revenue[i]!,
      eps: h.eps[i]!,
      capex: h.capex[i]!,
      fcf,
      fcfMargin: fcf / h.revenue[i]!,
      otherIncome: h.otherIncome[i]!,
      employees: h.employees[i]!,
      shares: h.shares[i]!,
    };
  });
}

/**
 * Forecast FY26–FY28 from FY25 actuals.
 * customGrowth ≠ 0 overrides all three growth rates (Dashboard!C6 → Assumptions!C23:C25).
 */
export function forecastRows(a: ScenarioAssumptions, customGrowth = 0): Row[] {
  const last = HISTORICAL.revenue.length - 1;
  let prevRev: number = HISTORICAL.revenue[last]!;
  return FORECAST_YEARS.map((year, i) => {
    const g: number = customGrowth !== 0 ? customGrowth : a.revenueGrowth[i]!;
    const revenue = prevRev * (1 + g);
    const ebitda = revenue * a.ebitdaMargin[i]!;
    const depreciation = revenue * a.depreciationPct;
    const ebit = ebitda - depreciation;
    const tax = ebit * a.taxRate;
    const netProfit = ebit - tax;
    const capex = revenue * a.capexPct;
    const fcf = netProfit + depreciation - capex;
    prevRev = revenue;
    return {
      year,
      isForecast: true,
      revenue,
      revenueGrowth: g,
      ebitda,
      ebitdaMargin: a.ebitdaMargin[i]!,
      depreciation,
      ebit,
      ebitMargin: ebit / revenue,
      tax,
      netProfit,
      netMargin: netProfit / revenue,
      eps: netProfit / a.shares,
      capex,
      fcf,
      fcfMargin: fcf / revenue,
      otherIncome: null,
      employees: null,
      shares: a.shares,
    };
  });
}

export interface ModelOutput {
  hist: Row[];
  fc: Row[];
  all: Row[];
  base: Row; // FY2025 actual
  end: Row; // FY2028 forecast
  cagr3y: { revenue: number; netProfit: number; eps: number; ebitda: number; fcf: number };
  avgGrowth: number;
}

export function runModel(a: ScenarioAssumptions, customGrowth = 0): ModelOutput {
  const hist = historicalRows();
  const fc = forecastRows(a, customGrowth);
  const base = hist[hist.length - 1]!;
  const end = fc[fc.length - 1]!;
  return {
    hist,
    fc,
    all: [...hist, ...fc],
    base,
    end,
    cagr3y: {
      revenue: cagr(end.revenue, base.revenue, 3),
      netProfit: cagr(end.netProfit, base.netProfit, 3),
      eps: cagr(end.eps, base.eps, 3),
      ebitda: cagr(end.ebitda, base.ebitda, 3),
      fcf: cagr(end.fcf, base.fcf, 3),
    },
    avgGrowth: fc.reduce((s, r) => s + (r.revenueGrowth ?? 0), 0) / fc.length,
  };
}

/** Historical_Data!C21:D23 */
export function historicalCagr() {
  const h = HISTORICAL;
  const L = h.revenue.length - 1;
  return [
    { metric: "Revenue CAGR", y7: cagr(h.revenue[L]!, h.revenue[0]!, 7), y3: cagr(h.revenue[L]!, h.revenue[4]!, 3) },
    { metric: "Net Profit CAGR", y7: cagr(h.netProfit[L]!, h.netProfit[0]!, 7), y3: cagr(h.netProfit[L]!, h.netProfit[4]!, 3) },
    { metric: "EPS CAGR", y7: cagr(h.eps[L]!, h.eps[0]!, 7), y3: cagr(h.eps[L]!, h.eps[4]!, 3) },
  ];
}

/** Historical_Data!E21 status rule */
export const cagrStatus = (v: number) => (v > 0.05 ? "Strong" : v > 0 ? "Moderate" : "Declining");

export interface Check {
  id: number;
  name: string;
  condition: string;
  pass: boolean;
  details: string;
}

/** Validation!B9:G19 — the 11 automated checks, evaluated live. */
export function validationChecks(m: ModelOutput, a: ScenarioAssumptions, scenario: string, customGrowth: number, fmt: { n: (v: number) => string; p: (v: number) => string; inr: (v: number) => string }): Check[] {
  const f = m.fc;
  const g = f.map((r) => r.revenueGrowth ?? 0);
  const all = (k: (r: Row) => number) => f.every((r) => k(r) > 0);
  const tri = (k: (r: Row) => number, fn: (v: number) => string) => f.map((r, i) => `FY${26 + i}: ${fn(k(r))}`).join(" | ");
  const h = m.base;
  void customGrowth;
  return [
    { id: 1, name: "Positive Revenue FY26-FY28", condition: "All revenues > 0", pass: all((r) => r.revenue), details: tri((r) => r.revenue, fmt.n) },
    { id: 2, name: "Positive Net Profit FY26-FY28", condition: "All net profits > 0", pass: all((r) => r.netProfit), details: tri((r) => r.netProfit, fmt.n) },
    { id: 3, name: "Positive EPS FY26-FY28", condition: "All EPS > 0", pass: all((r) => r.eps), details: tri((r) => r.eps, fmt.inr) },
    { id: 4, name: "Revenue Growth Reasonability", condition: "Growth -20% to +30%", pass: g.every((x) => x >= -0.2 && x <= 0.3), details: g.map((x, i) => `FY${26 + i}: ${fmt.p(x)}`).join(" | ") },
    { id: 5, name: "EBITDA Margin Reasonability", condition: "Margin 15% to 40%", pass: a.ebitdaMargin[0]! >= 0.15 && a.ebitdaMargin[0]! <= 0.4, details: `EBITDA Margin: ${fmt.p(a.ebitdaMargin[0]!)}` },
    { id: 6, name: "Tax Rate Reasonability", condition: "Tax 15% to 35%", pass: a.taxRate >= 0.15 && a.taxRate <= 0.35, details: `Tax Rate: ${fmt.p(a.taxRate)}` },
    { id: 7, name: "Positive FCF FY26-FY28", condition: "All FCF > 0", pass: all((r) => r.fcf), details: tri((r) => r.fcf, fmt.n) },
    { id: 8, name: "Historical Data Complete", condition: "FY25 data present", pass: h.revenue > 0 && h.netProfit > 0 && h.eps > 0, details: `Rev: ${fmt.n(h.revenue)} | NP: ${fmt.n(h.netProfit)} | EPS: ${h.eps.toFixed(2)}` },
    { id: 9, name: "Net Margin within Range", condition: "Margin 10% to 30%", pass: f[0]!.netMargin >= 0.1 && f[0]!.netMargin <= 0.3, details: `Net Margin FY26: ${fmt.p(f[0]!.netMargin)}` },
    { id: 10, name: "No Calculation Errors", condition: "No #REF, #DIV/0, #VALUE", pass: f.every((r) => [r.revenue, r.netProfit, r.eps, r.fcf].every(Number.isFinite)), details: "Checked key forecast cells" },
    { id: 11, name: "Scenario Selection Valid", condition: "Base, Bull, or Bear", pass: ["Base", "Bull", "Bear"].includes(scenario), details: `Selected: ${scenario}` },
  ];
}

/**
 * Sensitivity (derived — not present in the source workbook): re-runs the same
 * forecast engine with uniform shifts to each year's revenue growth and EBITDA margin.
 */
export type SensMetric = "eps" | "netProfit" | "fcf" | "revenue";
export function sensitivityGrid(a: ScenarioAssumptions, customGrowth: number, growthShifts: number[], marginShifts: number[], metric: SensMetric) {
  return growthShifts.map((gs) =>
    marginShifts.map((ms) => {
      const g = (customGrowth !== 0 ? [customGrowth, customGrowth, customGrowth] : a.revenueGrowth).map((x) => x + gs) as [number, number, number];
      const out = runModel({ ...a, revenueGrowth: g, ebitdaMargin: a.ebitdaMargin.map((x) => x + ms) as [number, number, number] });
      return out.end[metric];
    }),
  );
}
