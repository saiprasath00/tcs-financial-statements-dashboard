import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BALANCE_SHEET_SOURCE, CONSOLIDATED_BALANCE_SHEET } from "@/model/data";
import { useModel } from "@/model/ModelProvider";
import { growth } from "@/model/engine";
import { fmtCr, fmtInr, fmtPct } from "@/model/format";
import { GroupedBars } from "@/components/terminal/charts";
import { Delta, KpiCard, Note, PageHeader, Panel, ScenarioBadge, Seg, YearTable } from "@/components/terminal/ui";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/statements")({
  head: () => pageMeta("Financial Statements", "Income statement and cash flow view of TCS FY2018–FY2028F with growth and margin percentages."),
  component: Statements,
});

function Statements() {
  const { model } = useModel();
  const [period, setPeriod] = useState<"all" | "hist" | "fc" | "last">("all");
  const [tab, setTab] = useState<"is" | "cf" | "bs">("is");
  const all = model.all;
  const idx = all.map((_, i) => i).filter((i) => (period === "hist" ? !all[i]!.isForecast : period === "fc" ? all[i]!.isForecast || i === 7 : period === "last" ? i >= 5 : true));
  const cols = idx.map((i) => all[i]!);
  const prev = (i: number) => (idx[i]! > 0 ? all[idx[i]! - 1]! : null);
  const yoy = (k: "revenue" | "ebitda" | "ebit" | "netProfit" | "eps" | "fcf") => cols.map((r, i) => <Delta key={i} v={prev(i) ? growth(r[k], prev(i)![k]) : null} />);
  const balanceSheet = CONSOLIDATED_BALANCE_SHEET;
  const latestBalanceSheet = balanceSheet[balanceSheet.length - 1]!;
  const priorBalanceSheet = balanceSheet[balanceSheet.length - 2]!;
  const balanceSheetChart = balanceSheet.map((r) => ({ label: r.year, assets: r.totalAssets, equity: r.totalEquity, liabilities: r.totalAssets - r.totalEquity }));

  return (
    <>
      <PageHeader eyebrow="07 · Statements" title="Financial Statements" right={<ScenarioBadge />}>
        Statement lines available in the source model. Historical columns are actuals; forecast columns follow the active scenario.
      </PageHeader>
      <div className="mb-4 flex flex-wrap gap-2">
        <Seg label="Statement" value={tab} onChange={setTab} options={[{ value: "is", label: "Income Statement" }, { value: "cf", label: "Cash Flow" }, { value: "bs", label: "Balance Sheet" }]} />
        <Seg label="Years" value={period} onChange={setPeriod} options={[{ value: "all", label: "FY18–FY28" }, { value: "hist", label: "Actuals" }, { value: "last", label: "FY23–FY28" }, { value: "fc", label: "FY25–FY28" }]} />
      </div>

      {tab === "is" && (
        <Panel title="Income Statement" subtitle="₹ Crore">
          <YearTable
            years={cols.map((r) => r.year)}
            forecastFlags={cols.map((r) => r.isForecast)}
            rows={[
              { label: "Revenue", values: cols.map((r) => fmtCr(r.revenue)), emphasis: true },
              { label: "YoY %", values: yoy("revenue"), muted: true },
              { label: "EBITDA", values: cols.map((r) => fmtCr(r.ebitda)) },
              { label: "EBITDA Margin %", values: cols.map((r) => fmtPct(r.ebitdaMargin)), muted: true },
              { label: "(−) Depreciation", values: cols.map((r) => fmtCr(r.depreciation)) },
              { label: "EBIT", values: cols.map((r) => fmtCr(r.ebit)) },
              { label: "EBIT Margin %", values: cols.map((r) => fmtPct(r.ebitMargin)), muted: true },
              { label: "Other Income (Net)", values: cols.map((r) => (r.otherIncome != null ? fmtCr(r.otherIncome) : "n/m")) },
              { label: "Tax Expense", values: cols.map((r) => (r.tax != null ? fmtCr(r.tax) : "n/a")) },
              { label: "Net Profit", values: cols.map((r) => fmtCr(r.netProfit)), emphasis: true },
              { label: "Net Margin %", values: cols.map((r) => fmtPct(r.netMargin)), muted: true },
              { label: "YoY %", values: yoy("netProfit"), muted: true },
              { label: "EPS (₹)", values: cols.map((r) => fmtInr(r.eps)) },
              { label: "Shares Outstanding (Cr)", values: cols.map((r) => fmtCr(r.shares)) },
            ]}
          />
          <div className="mt-3 space-y-2">
            <Note>Historical tax expense is not provided in the source model (n/a). Other Income is not modelled in the forecast (n/m) — forecast Net Profit = EBIT − Tax.</Note>
          </div>
        </Panel>
      )}
      {tab === "cf" && (
        <Panel title="Cash Flow (Free Cash Flow build)" subtitle="₹ Crore · FCF = Net Profit + Depreciation − Capex">
          <YearTable
            years={cols.map((r) => r.year)}
            forecastFlags={cols.map((r) => r.isForecast)}
            rows={[
              { label: "Net Profit", values: cols.map((r) => fmtCr(r.netProfit)) },
              { label: "(+) Depreciation", values: cols.map((r) => fmtCr(r.depreciation)) },
              { label: "(−) Capex", values: cols.map((r) => fmtCr(-r.capex)) },
              { label: "Free Cash Flow", values: cols.map((r) => fmtCr(r.fcf)), emphasis: true },
              { label: "FCF Margin %", values: cols.map((r) => fmtPct(r.fcfMargin)), muted: true },
              { label: "YoY %", values: yoy("fcf"), muted: true },
              { label: "FCF / Net Profit", values: cols.map((r) => fmtPct(r.fcf / r.netProfit)), muted: true },
            ]}
          />
          <div className="mt-3"><Note>The source model does not contain a full cash flow statement (operating, investing, financing). Only the FCF build above is available.</Note></div>
        </Panel>
      )}
      {tab === "bs" && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Total Assets" value={`₹${fmtCr(latestBalanceSheet.totalAssets)}`} unit="Cr" sub="FY2026 actual" delta={growth(latestBalanceSheet.totalAssets, priorBalanceSheet.totalAssets)} deltaLabel="vs FY2025" />
            <KpiCard label="Total Equity" value={`₹${fmtCr(latestBalanceSheet.totalEquity)}`} unit="Cr" sub="FY2026 actual" delta={growth(latestBalanceSheet.totalEquity, priorBalanceSheet.totalEquity)} deltaLabel="vs FY2025" />
            <KpiCard label="Cash + Investments" value={`₹${fmtCr(latestBalanceSheet.cashAndEquivalents + latestBalanceSheet.currentInvestments)}`} unit="Cr" sub="₹40,187 Cr liquid assets" delta={growth(latestBalanceSheet.cashAndEquivalents + latestBalanceSheet.currentInvestments, priorBalanceSheet.cashAndEquivalents + priorBalanceSheet.currentInvestments)} deltaLabel="vs FY2025" />
            <KpiCard label="Total Liabilities" value={`₹${fmtCr(latestBalanceSheet.totalAssets - latestBalanceSheet.totalEquity)}`} unit="Cr" sub="FY2026 actual" delta={growth(latestBalanceSheet.totalAssets - latestBalanceSheet.totalEquity, priorBalanceSheet.totalAssets - priorBalanceSheet.totalEquity)} deltaLabel="vs FY2025" />
          </div>
          <div className="grid gap-4 xl:grid-cols-5">
            <Panel className="xl:col-span-3" title="Consolidated Balance Sheet" subtitle="₹ Crore · 31 March actuals">
              <YearTable
                years={balanceSheet.map((r) => r.year)}
                forecastFlags={balanceSheet.map(() => false)}
                rows={[
                  { label: "Non-current assets", values: balanceSheet.map((r) => fmtCr(r.nonCurrentAssets)) },
                  { label: "Current assets", values: balanceSheet.map((r) => fmtCr(r.currentAssets)) },
                  { label: "Total assets", values: balanceSheet.map((r) => fmtCr(r.totalAssets)), emphasis: true },
                  { label: "Cash & cash equivalents", values: balanceSheet.map((r) => fmtCr(r.cashAndEquivalents)), muted: true },
                  { label: "Current investments", values: balanceSheet.map((r) => fmtCr(r.currentInvestments)), muted: true },
                  { label: "Billed receivables", values: balanceSheet.map((r) => fmtCr(r.billedReceivables)), muted: true },
                  { label: "Unbilled receivables", values: balanceSheet.map((r) => fmtCr(r.unbilledReceivables)), muted: true },
                  { label: "Property, plant & equipment", values: balanceSheet.map((r) => fmtCr(r.propertyPlantEquipment)), muted: true },
                  { label: "Total equity", values: balanceSheet.map((r) => fmtCr(r.totalEquity)), emphasis: true },
                  { label: "Non-current liabilities", values: balanceSheet.map((r) => fmtCr(r.nonCurrentLiabilities)) },
                  { label: "Current liabilities", values: balanceSheet.map((r) => fmtCr(r.currentLiabilities)) },
                  { label: "Trade payables", values: balanceSheet.map((r) => fmtCr(r.tradePayables)), muted: true },
                  { label: "Total equity & liabilities", values: balanceSheet.map((r) => fmtCr(r.totalEquity + r.nonCurrentLiabilities + r.currentLiabilities)), emphasis: true },
                ]}
              />
            </Panel>
            <Panel className="xl:col-span-2" title="Capital structure" subtitle="Actual balance-sheet comparison">
              <GroupedBars data={balanceSheetChart} format="cr" series={[{ key: "assets", name: "Assets", color: "var(--chart-1)" }, { key: "equity", name: "Equity", color: "var(--chart-2)" }, { key: "liabilities", name: "Liabilities", color: "var(--chart-3)" }]} />
            </Panel>
          </div>
          <div className="mt-4"><Note>Balance-sheet actuals were added from the official <a className="font-medium text-primary underline underline-offset-2" href={BALANCE_SHEET_SOURCE.url} target="_blank" rel="noreferrer">{BALANCE_SHEET_SOURCE.name}</a>. They supplement the workbook and are not used to create FY2026–FY2028 forecast balance-sheet figures.</Note></div>
        </>
      )}
    </>
  );
}
