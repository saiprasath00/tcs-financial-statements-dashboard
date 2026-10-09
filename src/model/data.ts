/**
 * SOURCE DATA — transcribed verbatim from the uploaded workbook "ch_1.xlsx".
 * Sheet / cell references are kept next to every block so the model can be
 * updated later by editing this one file. Nothing here is derived; all
 * derived values are computed in ./engine.ts.
 */

export const HIST_YEARS = ["FY2018", "FY2019", "FY2020", "FY2021", "FY2022", "FY2023", "FY2024", "FY2025"] as const;
export const FORECAST_YEARS = ["FY2026", "FY2027", "FY2028"] as const;
export type Year = (typeof HIST_YEARS)[number] | (typeof FORECAST_YEARS)[number];

/** Historical_Data!C5:J17 — INR Crore unless noted */
export const HISTORICAL = {
  revenue: [123104, 146463, 156949, 164177, 191754, 225458, 240893, 255324],
  ebitda: [33800, 37450, 40520, 49680, 57075, 62708, 68718, 71369],
  ebit: [29500, 32700, 35550, 45615, 52471, 57686, 63733, 66135],
  otherIncome: [4826, 7572, 5790, 2947, 3478, 3617, 3366, 3670],
  netProfit: [25826, 31472, 32340, 32562, 38449, 42303, 46099, 48797],
  eps: [67.1, 83.05, 85.5, 87.67, 104.75, 115.19, 126.88, 134.2], // INR, official diluted
  shares: [385, 379, 378, 371, 367, 367, 363, 362], // Cr
  employees: [394998, 424285, 448464, 488649, 556986, 614795, 601546, 607979],
  depreciation: [4300, 4750, 4970, 4065, 4604, 5022, 4985, 5234],
  capex: [6702, 6463, 6113, 5254, 5556, 6328, 5857, 6255],
} as const;

export type ScenarioName = "Base" | "Bull" | "Bear";
export const SCENARIOS: ScenarioName[] = ["Bear", "Base", "Bull"];

export interface ScenarioAssumptions {
  revenueGrowth: [number, number, number]; // FY26, FY27, FY28
  ebitdaMargin: [number, number, number];
  impliedNpMargin: number; // reference estimate only — not used by the forecast formulas
  taxRate: number;
  depreciationPct: number; // % of revenue
  shares: number; // Cr
  capexPct: number; // % of revenue
}

/** Assumptions!C10:E19. Capex 2.5% is hard-coded in Forecast_Model!D28:F28 (same for all scenarios). */
export const SOURCE_ASSUMPTIONS: Record<ScenarioName, ScenarioAssumptions> = {
  Base: { revenueGrowth: [0.08, 0.085, 0.09], ebitdaMargin: [0.28, 0.282, 0.285], impliedNpMargin: 0.193, taxRate: 0.255, depreciationPct: 0.021, shares: 362, capexPct: 0.025 },
  Bull: { revenueGrowth: [0.12, 0.13, 0.14], ebitdaMargin: [0.3, 0.305, 0.31], impliedNpMargin: 0.198, taxRate: 0.25, depreciationPct: 0.02, shares: 362, capexPct: 0.025 },
  Bear: { revenueGrowth: [0.04, 0.045, 0.05], ebitdaMargin: [0.255, 0.257, 0.26], impliedNpMargin: 0.175, taxRate: 0.26, depreciationPct: 0.022, shares: 362, capexPct: 0.025 },
};

/** Assumptions!G10:G19 notes */
export const ASSUMPTION_NOTES = {
  revenueGrowth: ["YoY growth applied to FY25 base", "Continued momentum", "Long-term projection"],
  ebitdaMargin: ["Year 1 EBITDA Margin", "Year 2 - Operating leverage", "Year 3 - Margin expansion/stabilization"],
  impliedNpMargin: "ESTIMATE ONLY: Model derives NP from EBIT − Tax. Not used in forecast formulas.",
  taxRate: "Effective tax rate",
  depreciationPct: "Capital intensity",
  shares: "Assumed constant",
  capexPct: "Hard-coded as 2.5% of revenue inside Forecast_Model row 28 (not on Assumptions sheet)",
};

/** Workbook state when saved: Dashboard!C5 = "Bear", Dashboard!C6 = 0 */
export const WORKBOOK_SAVED_SCENARIO: ScenarioName = "Bear";

/** Dashboard!F72:G76 — static FY2028 scenario table as computed in the workbook (shortcut formulas). */
export const WORKBOOK_FY28_TABLE: Record<ScenarioName, { revenue: number; netProfit: number; eps: number; ebitda: number; cagr: number; formulaNote: string }> = {
  Base: { revenue: 326116, netProfit: 62926, eps: 173.83, ebitda: 91312, cagr: 0.08499231945407937, formulaNote: "Uses FY26 EBITDA margin (28.0%) for FY28" },
  Bull: { revenue: 368377, netProfit: 80122, eps: 221.33, ebitda: 114197, cagr: 0.12997050070483707, formulaNote: "Uses hard-coded 31% margin" },
  Bear: { revenue: 291360, netProfit: 50236, eps: 138.77, ebitda: 74297, cagr: 0.044992025457486706, formulaNote: "Uses FY26 EBITDA margin (25.5%) for FY28" },
};

/** Sources!B17:F25 — FY2025 reference data points */
export const SOURCE_DATAPOINTS = [
  { metric: "Operating Margin", value: "24.3%", note: "EBIT/Revenue", source: "4" },
  { metric: "Order Book TCV", value: "$39.4 Billion", note: "Total contract value won in FY25", source: "7" },
  { metric: "Attrition Rate", value: "13.3%", note: "LTM attrition rate", source: "7" },
  { metric: "Employees", value: "6,07,979", note: "Total employee count as of March 2025", source: "1" },
];

/**
 * Consolidated balance-sheet actuals — INR Crore, at 31 March.
 * These figures supplement the supplied workbook, which has no balance-sheet
 * schedule. They are intentionally kept outside the forecast engine: no
 * balance-sheet assumptions were supplied for FY2026–FY2028F.
 * Source: TCS Annual Report FY2025-26, consolidated balance sheet.
 */
export const CONSOLIDATED_BALANCE_SHEET = [
  {
    year: "FY2025",
    nonCurrentAssets: 36618,
    currentAssets: 123011,
    totalAssets: 159629,
    cashAndEquivalents: 8342,
    currentInvestments: 30689,
    billedReceivables: 50142,
    unbilledReceivables: 8904,
    propertyPlantEquipment: 10978,
    totalEquity: 95771,
    nonCurrentLiabilities: 10857,
    currentLiabilities: 53001,
    tradePayables: 13909,
  },
  {
    year: "FY2026",
    nonCurrentAssets: 46667,
    currentAssets: 135705,
    totalAssets: 182372,
    cashAndEquivalents: 6417,
    currentInvestments: 33770,
    billedReceivables: 57630,
    unbilledReceivables: 10084,
    propertyPlantEquipment: 11032,
    totalEquity: 108478,
    nonCurrentLiabilities: 12980,
    currentLiabilities: 60914,
    tradePayables: 14808,
  },
] as const;

export const BALANCE_SHEET_SOURCE = {
  name: "TCS Annual Report FY2025-26 — Consolidated Balance Sheet",
  url: "https://www.tcs.com/content/dam/tcs/investor-relations/financial-statements/2025-26/ar/annual-report-2025-2026.pdf",
};

/** Sources!B5:G13 */
export const SOURCES = [
  { name: "TCS Annual Report FY2025-26", type: "Consolidated balance-sheet actuals", url: "https://www.tcs.com/content/dam/tcs/investor-relations/financial-statements/2025-26/ar/annual-report-2025-2026.pdf", period: "FY2026" },
  { name: "TCS Annual Report FY2024-25", type: "Revenue, Profit, EPS, Employees", url: "https://www.tcs.com/content/dam/tcs/investor-relations/financial-statements/2024-25/ar/annual-report-2024-2025.pdf", period: "FY2025" },
  { name: "TCS Annual Report FY2023-24", type: "Revenue, Profit, EPS, EBITDA", url: "https://www.tcs.com/content/dam/tcs/investor-relations/financial-statements/2023-24/ar/annual-report-2023-2024.pdf", period: "FY2024" },
  { name: "TCS Annual Report FY2022-23", type: "Revenue, Profit, EPS, EBITDA", url: "https://www.tcs.com/content/dam/tcs/investor-relations/financial-statements/2022-23/ar/annual-report-2022-2023.pdf", period: "FY2023" },
  { name: "TCS Q4 FY24 Results (NSE Filing)", type: "Quarterly financial results PDF", url: "https://nsearchives.nseindia.com/corporate/TCS_12042024154155_SELetterFinancialResults.pdf", period: "Q4 FY24" },
  { name: "BSE India - TCS Filings", type: "Regulatory filings, Results", url: "https://www.bseindia.com/stock-share-price/tata-consultancy-services-ltd/tcs/532540/", period: "FY2018-2025" },
  { name: "NSE India - TCS Corporate Filings", type: "Annual reports, Financials", url: "https://www.nseindia.com/get-quotes/equity?symbol=TCS", period: "FY2018-2025" },
  { name: "TCS Investor Presentation FY25", type: "Order book, Deal wins, Guidance", url: "https://www.tcs.com/investor-relations/financial-statements", period: "FY2025" },
  { name: "AnnualReports.com - TCS Archive", type: "Historical Annual Reports (PDFs)", url: "https://www.annualreports.com/Company/tata-consultancy-services-ltd", period: "FY2004-2025" },
];

/** Dashboard!B79:H83 */
export const STRENGTHS = [
  "India's largest IT company - $30B+ revenue milestone in FY25",
  "Strong cash generation - FCF of ₹47,776 Cr in FY25",
  "Industry-leading margins - Operating margin ~24.3%",
  "Strong order book - $39.4B TCV in FY25",
];
export const RISKS = [
  "Currency volatility - 60%+ revenue from exports",
  "Global macro uncertainty - Tech spending slowdown risk",
  "North America weakness - -1.8% YoY growth in FY25",
  "Client concentration - Top 10 clients ~30% revenue",
];

/** Notes found in Historical_Data!B25:B26, Validation!B41:B42 */
export const MODEL_NOTES = {
  tax: "Implied tax rates FY18-20 appear low (3.8%-12.5%) because Other Income (₹4,826-₹7,572 Cr from interest, forex gains, investments) is taxed at lower rates or exempt. Effective tax on operating income was ~25-26%.",
  employees: "Employee count decreased by 13,249 (FY23→FY24) due to industry-wide IT hiring slowdown and TCS workforce optimization. Confirmed in FY24 annual report.",
  eps: "EPS ₹134.20 is TCS official diluted EPS (weighted average shares differ from year-end count). Formula-derived = ₹134.80 based on year-end shares.",
};

/** Validation!B22:G35 — static inconsistency report recorded in the workbook */
export const INCONSISTENCY_REPORT = [
  { issue: "FCF FY2025 Mismatch", location: "Historical_Data vs Dashboard", values: "47,776 = 47,776", status: "FIXED", action: "Formula-based: NP + Depr - Capex across all sheets" },
  { issue: "FCF FY25 Rounding", location: "Dashboard!G10 vs Forecast_Model!C29", values: "Minor rounding", status: "OK", action: "Acceptable difference" },
  { issue: "EBITDA Margin FY25", location: "Calculated: 71369/255324", values: "27.95% vs 28.0%", status: "OK", action: "Rounded display" },
  { issue: "Net Profit Margin FY25", location: "Calculated: 48797/255324", values: "0.1911", status: "OK", action: "Matches" },
  { issue: "EPS FY25 Calculation", location: "Net Profit/Shares: 48797/362", values: "₹134.20 (Official Diluted)", status: "VERIFIED", action: "Official TCS diluted EPS used" },
  { issue: "Historical EPS Calculation", location: "All years FY18-FY24", values: "Formula based", status: "OK", action: "Matches within rounding" },
  { issue: "Scenario Linkage", location: "Bull case selected", values: "12%, 13%, 14% growth", status: "OK", action: "Correctly linked" },
  { issue: "EBITDA Margin Trend", location: "FY18-FY25 trend", values: "25.6% to 28%", status: "OK", action: "Reasonable fluctuation" },
  { issue: "Employee Count FY23-FY24", location: "614,795 → 601,546", values: "Decrease of 13,249", status: "VERIFIED", action: "Industry-wide slowdown post-FY23" },
  { issue: "Revenue Growth FY25", location: "(255324-240893)/240893", values: "5.99% ≈ 6%", status: "OK", action: "Correct calculation" },
  { issue: "FCF Formula FY25", location: "NP + Depr - Capex", values: "47,656 Cr", status: "OK", action: "Formula correct" },
  { issue: "Forecast Revenue FY26", location: "255324 × 1.12", values: "285,963 Cr", status: "OK", action: "Correct" },
  { issue: "3Y Revenue CAGR", location: "(FY28/FY25)^(1/3)-1", values: "0.13", status: "OK", action: "Correct calculation" },
];
