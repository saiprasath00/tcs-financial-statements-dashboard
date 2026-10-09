import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useModel } from "@/model/ModelProvider";
import { growth } from "@/model/engine";
import { fmtCr, fmtInr, fmtPct } from "@/model/format";
import { Delta, Note, PageHeader, Panel, ScenarioBadge, Seg, YearTable } from "@/components/terminal/ui";
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
        <div className="grid gap-4 xl:grid-cols-3">
          <Panel className="xl:col-span-2" title="Financial position data coverage" subtitle="The supplied workbook does not contain a balance sheet">
            <div className="-mx-4 overflow-x-auto">
              <table className="w-full min-w-[580px] text-sm">
                <thead><tr className="border-b text-left text-[11px] uppercase tracking-wider text-muted-foreground"><th className="px-4 py-2">Balance-sheet line</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Reason</th></tr></thead>
                <tbody>
                  {[["Cash & investments", "Not provided", "No balance-sheet schedule in the workbook"], ["Receivables / working capital", "Not provided", "No working-capital assumptions in the workbook"], ["Property, plant & equipment", "Not provided", "Depreciation and capex are included, but closing asset balances are not"], ["Debt & lease liabilities", "Not provided", "No financing schedule in the workbook"], ["Equity & retained earnings", "Not provided", "No equity roll-forward in the workbook"]].map(([line, status, reason]) => <tr key={line} className="border-b border-border/50"><td className="px-4 py-3 font-medium">{line}</td><td className="px-4 py-3"><span className="rounded-full bg-warning/10 px-2 py-1 text-xs text-warning">{status}</span></td><td className="px-4 py-3 text-muted-foreground">{reason}</td></tr>)}
                </tbody>
              </table>
            </div>
            <div className="mt-4"><Note tone="warn">A complete balance sheet requires source values for assets, liabilities, and equity. This dashboard does not infer them from income-statement data.</Note></div>
          </Panel>
          <Panel title="Available capital signals" subtitle="Workbook-backed indicators">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">FY25 shares outstanding</dt><dd className="num font-semibold">{fmtCr(model.base.shares)} Cr</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">FY25 capex</dt><dd className="num font-semibold">₹{fmtCr(model.base.capex)} Cr</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">FY25 free cash flow</dt><dd className="num font-semibold">₹{fmtCr(model.base.fcf)} Cr</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">FY28F capex</dt><dd className="num font-semibold">₹{fmtCr(model.end.capex)} Cr</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">FY28F free cash flow</dt><dd className="num font-semibold">₹{fmtCr(model.end.fcf)} Cr</dd></div>
            </dl>
          </Panel>
        </div>
      )}
    </>
  );
}
