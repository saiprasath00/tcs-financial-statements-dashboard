import { createFileRoute, Link } from "@tanstack/react-router";
import { useModel } from "@/model/ModelProvider";
import { historicalCagr, cagrStatus } from "@/model/engine";
import { STRENGTHS, RISKS } from "@/model/data";
import { fmtCr, fmtInr, fmtPct, fmtPp } from "@/model/format";
import { PageHeader, Panel, ScenarioBadge, YearTable, Delta } from "@/components/terminal/ui";
import { TrendChart } from "@/components/terminal/charts";
import { cn } from "@/lib/utils";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/")({
  head: () => pageMeta("Overview", "Executive dashboard of the TCS forecasting model: FY25 actuals, FY28 forecast, CAGR, margins and scenario summary."),
  component: Overview,
});

function Overview() {
  const { model, scenario, active, checks, customGrowth } = useModel();
  const { base, end, fc, all, cagr3y } = model;
  const hc = historicalCagr();
  const passed = checks.filter((c) => c.pass).length;

  const kpi = [
    { label: "Revenue", a: base.revenue, f: end.revenue, unit: "₹ Cr", fmt: (v: number) => fmtCr(v), c: cagr3y.revenue },
    { label: "EBITDA", a: base.ebitda, f: end.ebitda, unit: "₹ Cr", fmt: (v: number) => fmtCr(v), c: cagr3y.ebitda },
    { label: "EBIT", a: base.ebit, f: end.ebit, unit: "₹ Cr", fmt: (v: number) => fmtCr(v), c: Math.pow(end.ebit / base.ebit, 1 / 3) - 1 },
    { label: "Net Profit", a: base.netProfit, f: end.netProfit, unit: "₹ Cr", fmt: (v: number) => fmtCr(v), c: cagr3y.netProfit },
    { label: "EPS (Diluted)", a: base.eps, f: end.eps, unit: "", fmt: fmtInr, c: cagr3y.eps },
    { label: "Free Cash Flow", a: base.fcf, f: end.fcf, unit: "₹ Cr", fmt: (v: number) => fmtCr(v), c: cagr3y.fcf },
  ];

  const summaryRows = [
    { label: "Revenue (₹ Cr)", vals: [base, ...fc].map((r) => fmtCr(r.revenue)), k: cagr3y.revenue },
    { label: "Net Profit (₹ Cr)", vals: [base, ...fc].map((r) => fmtCr(r.netProfit)), k: cagr3y.netProfit },
    { label: "EPS (₹)", vals: [base, ...fc].map((r) => fmtInr(r.eps)), k: cagr3y.eps },
    { label: "EBITDA (₹ Cr)", vals: [base, ...fc].map((r) => fmtCr(r.ebitda)), k: cagr3y.ebitda },
    { label: "Free Cash Flow (₹ Cr)", vals: [base, ...fc].map((r) => fmtCr(r.fcf)), k: cagr3y.fcf },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Independent Academic Financial Analysis & Forecasting Project"
        title="Tata Consultancy Services Limited"
        right={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Active <ScenarioBadge />
          </div>
        }
      >
        Historical FY2018–FY2025 actuals from TCS Annual Reports, projected to FY2028 under Base, Bull and Bear scenarios. All values in ₹ Crore unless stated.
      </PageHeader>

      <section className="rounded-sm border bg-panel">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b px-4 py-2.5">
          <h2 className="text-[13px] font-semibold text-primary">Financial Summary</h2>
          <span className="text-[11px] text-muted-foreground">
            <span className="text-actual">FY2025 Actual</span> → <span className="text-forecast">FY2028 Forecast ({scenario})</span> · 3-year CAGR
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {kpi.map((k, i) => (
            <div key={k.label} className={cn("min-w-0 border-border px-4 py-4", i % 2 === 1 && "border-l", "md:border-l-0 md:[&:not(:nth-child(3n+1))]:border-l xl:[&:not(:first-child)]:border-l", i >= 2 && "border-t md:border-t-0", i >= 3 && "md:border-t xl:border-t-0")}>
              <div className="text-xs text-muted-foreground">{k.label} <span className="text-muted-foreground/70">{k.unit ? `(${k.unit})` : "(₹)"}</span></div>
              <div className="mt-1 truncate text-[22px] font-semibold leading-tight tracking-tight tabular-nums text-foreground">{k.fmt(k.f)}</div>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2 text-[11px]">
                <span className="font-medium tabular-nums"><Delta v={k.c} /></span>
                <span className="tabular-nums text-muted-foreground">from {k.fmt(k.a)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 border-t bg-panel-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Revenue CAGR FY18–25", fmtPct(hc[0]!.y7), cagrStatus(hc[0]!.y7)],
            ["Net Profit CAGR FY18–25", fmtPct(hc[1]!.y7), cagrStatus(hc[1]!.y7)],
            ["EBITDA Margin FY28F", fmtPct(end.ebitdaMargin), `${fmtPp(end.ebitdaMargin - base.ebitdaMargin)} vs FY25`],
            ["Net Margin FY28F", fmtPct(end.netMargin), `${fmtPp(end.netMargin - base.netMargin)} vs FY25`],
          ].map(([l, v, s2], i) => (
            <div key={l} className={cn("flex items-baseline justify-between gap-2 px-4 py-2.5", i > 0 && "border-t", i % 2 === 1 && "sm:border-l", i === 1 && "sm:border-t-0", i >= 2 && "lg:border-t-0", i === 2 && "lg:border-l")}>
              <span className="text-muted-foreground">{l}</span>
              <span className="whitespace-nowrap"><span className="font-semibold tabular-nums">{v}</span> <span className="text-[10px] text-muted-foreground">{s2}</span></span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-4 xl:grid-cols-5">
        <Panel className="xl:col-span-3" title="Revenue vs Net Profit" subtitle="₹ Crore · shaded region = forecast">
          <TrendChart
            data={all}
            forecastStart="FY2026"
            series={[
              { key: "revenue", name: "Revenue", color: "var(--chart-1)", type: "bar" },
              { key: "netProfit", name: "Net Profit", color: "var(--chart-2)", type: "bar" },
            ]}
          />
        </Panel>
        <Panel className="xl:col-span-2" title="Margin Trend" subtitle="EBITDA & Net Profit margin">
          <TrendChart
            data={all}
            format="pct"
            forecastStart="FY2026"
            series={[
              { key: "ebitdaMargin", name: "EBITDA Margin", color: "var(--chart-1)" },
              { key: "netMargin", name: "Net Margin", color: "var(--chart-2)" },
            ]}
          />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Forecast Summary" subtitle={`KPI dashboard (${scenario} Case)${customGrowth ? " · custom growth override active" : ""}`} right={<Link to="/forecast" className="text-xs text-forecast hover:underline">Full forecast →</Link>}>
          <YearTable
            years={["FY2025", "FY2026", "FY2027", "FY2028", "3Y CAGR"]}
            forecastFlags={[false, true, true, true, true]}
            rows={summaryRows.map((r) => ({ label: r.label, values: [...r.vals, <Delta key="c" v={r.k} />] }))}
          />
        </Panel>
        <Panel title="Key Assumptions" subtitle={`${scenario} Case`} right={<Link to="/assumptions" className="text-xs text-forecast hover:underline">Edit →</Link>}>
          <dl className="space-y-2 text-sm">
            {[
              ["Revenue Growth FY26 / 27 / 28", fc.map((r) => fmtPct(r.revenueGrowth)).join(" / ")],
              ["EBITDA Margin FY26 / 27 / 28", active.ebitdaMargin.map((v) => fmtPct(v)).join(" / ")],
              ["Tax Rate", fmtPct(active.taxRate)],
              ["Depreciation (% of Rev)", fmtPct(active.depreciationPct)],
              ["Capex (% of Rev)", fmtPct(active.capexPct)],
              ["Shares Outstanding", `${active.shares} Cr`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-2">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="num text-right text-warning">{v}</dd>
              </div>
            ))}
          </dl>
          <Link to="/validation" className={cn("mt-4 flex items-center justify-between rounded border px-3 py-2 text-sm", passed === checks.length ? "border-positive/40 text-positive" : "border-negative/40 text-negative")}>
            <span>Model Validation</span>
            <span className="num">
              {passed} / {checks.length} checks passed
            </span>
          </Link>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Panel title="Key Strengths" subtitle="As stated in the source model">
          <ul className="space-y-2 text-sm">
            {STRENGTHS.map((s) => (
              <li key={s} className="flex gap-2"><span className="text-positive">+</span>{s}</li>
            ))}
          </ul>
        </Panel>
        <Panel title="Key Risks" subtitle="As stated in the source model">
          <ul className="space-y-2 text-sm">
            {RISKS.map((s) => (
              <li key={s} className="flex gap-2"><span className="text-negative">−</span>{s}</li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
