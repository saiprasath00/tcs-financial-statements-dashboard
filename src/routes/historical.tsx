import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { historicalRows, historicalCagr, cagrStatus, type Row } from "@/model/engine";
import { HIST_YEARS, MODEL_NOTES } from "@/model/data";
import { fmtCr, fmtInr, fmtPct } from "@/model/format";
import { Note, PageHeader, Panel, Seg, YearTable, Delta, KpiCard } from "@/components/terminal/ui";
import { TrendChart, type Fmt } from "@/components/terminal/charts";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/historical")({
  head: () => pageMeta("Historical Financials", "TCS actual financials FY2018–FY2025: revenue, EBITDA, EBIT, net profit, EPS, free cash flow, margins and CAGR."),
  component: Historical,
});

type View = "revenue" | "ebitda" | "ebit" | "netProfit" | "eps" | "fcf" | "margins" | "employees";
const VIEWS: { value: View; label: string; fmt: Fmt; series: { key: keyof Row; name: string; color: string; type?: "bar" | "line" }[] }[] = [
  { value: "revenue", label: "Revenue", fmt: "cr", series: [{ key: "revenue", name: "Revenue", color: "var(--chart-1)", type: "bar" }] },
  { value: "ebitda", label: "EBITDA", fmt: "cr", series: [{ key: "ebitda", name: "EBITDA", color: "var(--chart-1)", type: "bar" }] },
  { value: "ebit", label: "EBIT", fmt: "cr", series: [{ key: "ebit", name: "EBIT", color: "var(--chart-1)", type: "bar" }] },
  { value: "netProfit", label: "Net Profit", fmt: "cr", series: [{ key: "netProfit", name: "Net Profit", color: "var(--chart-2)", type: "bar" }] },
  { value: "eps", label: "EPS", fmt: "inr", series: [{ key: "eps", name: "EPS (Diluted)", color: "var(--chart-2)", type: "bar" }] },
  { value: "fcf", label: "Free Cash Flow", fmt: "cr", series: [{ key: "fcf", name: "FCF", color: "var(--chart-3)", type: "bar" }, { key: "netProfit", name: "Net Profit", color: "var(--chart-2)" }] },
  { value: "margins", label: "Margins", fmt: "pct", series: [{ key: "ebitdaMargin", name: "EBITDA Margin", color: "var(--chart-1)" }, { key: "ebitMargin", name: "EBIT Margin", color: "var(--chart-5)" }, { key: "netMargin", name: "Net Margin", color: "var(--chart-2)" }] },
  { value: "employees", label: "Employees", fmt: "cr", series: [{ key: "employees", name: "Employees (No.)", color: "var(--chart-5)", type: "bar" }] },
];

function Historical() {
  const rows = historicalRows();
  const [view, setView] = useState<View>("revenue");
  const [mode, setMode] = useState<"chart" | "table">("chart");
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(HIST_YEARS.length - 1);
  const v = VIEWS.find((x) => x.value === view)!;
  const slice = rows.slice(from, to + 1);
  const span = to - from;
  const first = slice[0]!;
  const last = slice[slice.length - 1]!;
  const hc = historicalCagr();
  const metricKey = v.series[0]!.key;
  const periodCagr = span > 0 && v.fmt !== "pct" ? Math.pow((last[metricKey] as number) / (first[metricKey] as number), 1 / span) - 1 : null;

  const tableRows = [
    { label: "Revenue", values: slice.map((r) => fmtCr(r.revenue)), emphasis: true },
    { label: "YoY Growth %", values: slice.map((r) => <Delta key={r.year} v={r.revenueGrowth} />), muted: true },
    { label: "EBITDA", values: slice.map((r) => fmtCr(r.ebitda)) },
    { label: "EBITDA Margin %", values: slice.map((r) => fmtPct(r.ebitdaMargin)), muted: true },
    { label: "Depreciation", values: slice.map((r) => fmtCr(r.depreciation)) },
    { label: "EBIT", values: slice.map((r) => fmtCr(r.ebit)) },
    { label: "Other Income (Net)", values: slice.map((r) => fmtCr(r.otherIncome)) },
    { label: "Net Profit", values: slice.map((r) => fmtCr(r.netProfit)), emphasis: true },
    { label: "Net Profit Margin %", values: slice.map((r) => fmtPct(r.netMargin)), muted: true },
    { label: "EPS - Diluted (₹)", values: slice.map((r) => fmtInr(r.eps)) },
    { label: "Shares Outstanding (Cr)", values: slice.map((r) => fmtCr(r.shares)) },
    { label: "Capex", values: slice.map((r) => fmtCr(r.capex)) },
    { label: "Free Cash Flow", values: slice.map((r) => fmtCr(r.fcf)), emphasis: true },
    { label: "Employees (No.)", values: slice.map((r) => fmtCr(r.employees)) },
  ];

  const yearSel = (val: number, set: (n: number) => void, min: number, max: number, label: string) => (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      {label}
      <select aria-label={label} value={val} onChange={(e) => set(Number(e.target.value))} className="num h-8 rounded border bg-background px-2 text-xs text-foreground">
        {HIST_YEARS.map((y, i) => (
          <option key={y} value={i} disabled={i < min || i > max}>{y}</option>
        ))}
      </select>
    </label>
  );

  return (
    <>
      <PageHeader eyebrow="02 · Actuals" title="Historical Financials">
        FY2018–FY2025 as recorded on the Historical_Data sheet. Source: TCS Annual Reports. Values are read-only.
      </PageHeader>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {hc.map((c) => (
          <KpiCard key={c.metric} label={c.metric} value={fmtPct(c.y7)} sub={<>7Y · 3Y {fmtPct(c.y3)} · {cagrStatus(c.y7)}</>} forecast={false} />
        ))}
      </div>

      <Panel
        title={v.label}
        subtitle={`${HIST_YEARS[from]}–${HIST_YEARS[to]}${periodCagr != null ? ` · period CAGR ${fmtPct(periodCagr)}` : ""}`}
        right={
          <div className="flex flex-wrap items-center gap-2">
            {yearSel(from, setFrom, 0, to - 1, "From")}
            {yearSel(to, setTo, from + 1, HIST_YEARS.length - 1, "To")}
            <Seg label="View mode" value={mode} onChange={setMode} options={[{ value: "chart", label: "Chart" }, { value: "table", label: "Table" }]} />
          </div>
        }
      >
        <div className="mb-4 overflow-x-auto">
          <Seg label="Metric" value={view} onChange={setView} options={VIEWS.map((x) => ({ value: x.value, label: x.label }))} />
        </div>
        {mode === "chart" ? (
          <TrendChart data={slice} format={v.fmt} series={v.series.map((s) => ({ ...s, key: s.key as string }))} height={320} />
        ) : (
          <YearTable years={slice.map((r) => r.year)} forecastFlags={slice.map(() => false)} rows={tableRows} />
        )}
      </Panel>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Note tone="warn">{MODEL_NOTES.tax}</Note>
        <Note>{MODEL_NOTES.employees}</Note>
        <Note>Free Cash Flow is computed in the model as Net Profit + Depreciation − Capex (Historical_Data row 18).</Note>
        <Note>{MODEL_NOTES.eps}</Note>
      </div>
    </>
  );
}
