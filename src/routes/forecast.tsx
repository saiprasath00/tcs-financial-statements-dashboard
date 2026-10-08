import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useModel } from "@/model/ModelProvider";
import { growth } from "@/model/engine";
import { fmtCr, fmtInr, fmtPct } from "@/model/format";
import { PageHeader, Panel, ScenarioBadge, Seg, YearTable, Delta, Note } from "@/components/terminal/ui";
import { TrendChart, type Fmt } from "@/components/terminal/charts";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/forecast")({
  head: () => pageMeta("Forecast", "FY2026–FY2028 forecast of TCS revenue, EBITDA, EBIT, net profit, EPS and free cash flow from the model's assumptions."),
  component: Forecast,
});

const METRICS: { value: string; label: string; fmt: Fmt }[] = [
  { value: "revenue", label: "Revenue", fmt: "cr" },
  { value: "ebitda", label: "EBITDA", fmt: "cr" },
  { value: "ebit", label: "EBIT", fmt: "cr" },
  { value: "netProfit", label: "Net Profit", fmt: "cr" },
  { value: "eps", label: "EPS", fmt: "inr" },
  { value: "fcf", label: "FCF", fmt: "cr" },
];

function Forecast() {
  const { model, customGrowth } = useModel();
  const [metric, setMetric] = useState("revenue");
  const m = METRICS.find((x) => x.value === metric)!;
  const cols = [model.base, ...model.fc];
  const years = cols.map((r) => r.year);
  const flags = cols.map((r) => r.isForecast);
  const g = (k: "netProfit" | "eps" | "fcf") => cols.map((r, i) => (i === 0 ? "—" : <Delta key={i} v={growth(r[k], cols[i - 1]![k])} />));

  return (
    <>
      <PageHeader eyebrow="03 · Projection" title="Forecast Model FY2026–FY2028" right={<ScenarioBadge />}>
        FY2025 actuals are the base year. Each forecast year = prior-year revenue × (1 + growth), then margins, depreciation, tax and capex are applied from the active scenario.
      </PageHeader>
      {customGrowth !== 0 && <div className="mb-4"><Note tone="warn">Custom growth override of {fmtPct(customGrowth)} is applied uniformly to FY26–FY28 (Dashboard!C6 behaviour).</Note></div>}

      <Panel title="Actual + Forecast" subtitle="FY2018–FY2025 actual · FY2026–FY2028 forecast" right={<Seg label="Metric" value={metric} onChange={setMetric} options={METRICS} />}>
        <TrendChart
          data={model.all}
          format={m.fmt}
          forecastStart="FY2026"
          height={320}
          series={[
            { key: metric, name: m.label, color: "var(--chart-1)", type: "bar" },
            ...(m.fmt === "cr" ? [{ key: "revenueGrowth", name: "Revenue Growth %", color: "var(--chart-2)", axis: "right" as const }] : []),
          ]}
        />
      </Panel>

      <Panel className="mt-4" title="Income Statement Forecast" subtitle="₹ Crore · Forecast_Model rows 13–22">
        <YearTable
          years={years}
          forecastFlags={flags}
          rows={[
            { label: "Revenue", values: cols.map((r) => fmtCr(r.revenue)), emphasis: true },
            { label: "Revenue Growth %", values: cols.map((r) => fmtPct(r.revenueGrowth)), muted: true },
            { label: "EBITDA", values: cols.map((r) => fmtCr(r.ebitda)) },
            { label: "EBITDA Margin %", values: cols.map((r) => fmtPct(r.ebitdaMargin)), muted: true },
            { label: "Depreciation", values: cols.map((r) => fmtCr(r.depreciation)) },
            { label: "EBIT (Operating Profit)", values: cols.map((r) => fmtCr(r.ebit)) },
            { label: "Tax Expense", values: cols.map((r) => (r.isForecast ? fmtCr(r.tax) : "n/a")) },
            { label: "Net Profit", values: cols.map((r) => fmtCr(r.netProfit)), emphasis: true },
            { label: "Net Profit Margin %", values: cols.map((r) => fmtPct(r.netMargin)), muted: true },
            { label: "EPS (₹)", values: cols.map((r) => fmtInr(r.eps)) },
          ]}
        />
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Free Cash Flow Projection" subtitle="Forecast_Model rows 26–30">
          <YearTable
            years={years}
            forecastFlags={flags}
            rows={[
              { label: "Net Profit", values: cols.map((r) => fmtCr(r.netProfit)) },
              { label: "(+) Depreciation", values: cols.map((r) => fmtCr(r.depreciation)) },
              { label: "(−) Capex", values: cols.map((r) => fmtCr(-r.capex)) },
              { label: "Free Cash Flow", values: cols.map((r) => fmtCr(r.fcf)), emphasis: true },
              { label: "FCF Margin %", values: cols.map((r) => fmtPct(r.fcfMargin)), muted: true },
            ]}
          />
        </Panel>
        <Panel title="Growth Metrics Summary" subtitle="Year-on-year">
          <YearTable
            years={years}
            forecastFlags={flags}
            rows={[
              { label: "Revenue Growth", values: cols.map((r, i) => (i === 0 ? fmtPct(r.revenueGrowth) : <Delta key={i} v={r.revenueGrowth} />)) },
              { label: "Net Profit Growth", values: g("netProfit") },
              { label: "EPS Growth", values: g("eps") },
              { label: "FCF Growth", values: g("fcf") },
            ]}
          />
        </Panel>
      </div>
      <div className="mt-4 space-y-2">
        <Note>Forecast Net Profit is derived as EBIT − Tax; it does not include Other Income. This is why FY26 net margin steps down versus the FY25 actual (which includes Other Income).</Note>
        <Note>Forecast EPS = Net Profit ÷ assumed shares (362 Cr). FY25 EPS is the official diluted figure (₹134.20).</Note>
      </div>
    </>
  );
}
