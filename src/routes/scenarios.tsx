import { createFileRoute } from "@tanstack/react-router";
import { useModel } from "@/model/ModelProvider";
import { SCENARIOS, type ScenarioName } from "@/model/data";
import { fmtCr, fmtInr, fmtPct } from "@/model/format";
import { PageHeader, Panel, ScenarioSelector, scenarioColor, Note, Delta } from "@/components/terminal/ui";
import { GroupedBars, TrendChart } from "@/components/terminal/charts";
import { cn } from "@/lib/utils";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/scenarios")({
  head: () => pageMeta("Scenarios", "Bear vs Base vs Bull comparison of the TCS forecast: FY2028 revenue, EBITDA, net profit, EPS, FCF, margins and CAGR."),
  component: Scenarios,
});

function Scenarios() {
  const { byScenario, scenario, setScenario, assumptions } = useModel();

  const metrics: { label: string; get: (s: ScenarioName) => number; f: (v: number) => string; pct?: boolean }[] = [
    { label: "Revenue FY28 (₹ Cr)", get: (s) => byScenario[s].end.revenue, f: (v) => fmtCr(v) },
    { label: "EBITDA FY28 (₹ Cr)", get: (s) => byScenario[s].end.ebitda, f: (v) => fmtCr(v) },
    { label: "EBIT FY28 (₹ Cr)", get: (s) => byScenario[s].end.ebit, f: (v) => fmtCr(v) },
    { label: "Net Profit FY28 (₹ Cr)", get: (s) => byScenario[s].end.netProfit, f: (v) => fmtCr(v) },
    { label: "EPS FY28 (₹)", get: (s) => byScenario[s].end.eps, f: fmtInr },
    { label: "FCF FY28 (₹ Cr)", get: (s) => byScenario[s].end.fcf, f: (v) => fmtCr(v) },
    { label: "EBITDA Margin FY28", get: (s) => byScenario[s].end.ebitdaMargin, f: (v) => fmtPct(v), pct: true },
    { label: "Net Margin FY28", get: (s) => byScenario[s].end.netMargin, f: (v) => fmtPct(v), pct: true },
    { label: "3Y Revenue CAGR", get: (s) => byScenario[s].cagr3y.revenue, f: (v) => fmtPct(v), pct: true },
    { label: "3Y Net Profit CAGR", get: (s) => byScenario[s].cagr3y.netProfit, f: (v) => fmtPct(v), pct: true },
    { label: "3Y EPS CAGR", get: (s) => byScenario[s].cagr3y.eps, f: (v) => fmtPct(v), pct: true },
  ];

  const path = byScenario.Base.all.map((r, i) => ({
    year: r.year,
    isForecast: r.isForecast,
    Bear: byScenario.Bear.all[i]!.revenue,
    Base: r.revenue,
    Bull: byScenario.Bull.all[i]!.revenue,
  }));
  const npPath = byScenario.Base.all.map((r, i) => ({ year: r.year, isForecast: r.isForecast, Bear: byScenario.Bear.all[i]!.netProfit, Base: r.netProfit, Bull: byScenario.Bull.all[i]!.netProfit }));
  const bars = [
    { label: "Revenue", Bear: byScenario.Bear.end.revenue, Base: byScenario.Base.end.revenue, Bull: byScenario.Bull.end.revenue },
    { label: "EBITDA", Bear: byScenario.Bear.end.ebitda, Base: byScenario.Base.end.ebitda, Bull: byScenario.Bull.end.ebitda },
    { label: "Net Profit", Bear: byScenario.Bear.end.netProfit, Base: byScenario.Base.end.netProfit, Bull: byScenario.Bull.end.netProfit },
    { label: "FCF", Bear: byScenario.Bear.end.fcf, Base: byScenario.Base.end.fcf, Bull: byScenario.Bull.end.fcf },
  ];
  const series = SCENARIOS.map((s) => ({ key: s, name: s, color: scenarioColor[s], dashed: s !== scenario }));

  return (
    <>
      <PageHeader eyebrow="04 · Scenario Engine" title="Bear vs Base vs Bull" right={<ScenarioSelector />}>
        Each scenario uses its own column of parameters from the Assumptions sheet (CHOOSE on the selected index). Switching the active scenario updates every page.
      </PageHeader>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {SCENARIOS.map((s) => {
          const m = byScenario[s];
          const a = assumptions[s];
          return (
            <button key={s} onClick={() => setScenario(s)} className={cn("rounded border bg-panel p-4 text-left transition-colors", s === scenario ? "ring-1" : "opacity-80 hover:opacity-100")} style={s === scenario ? { borderColor: scenarioColor[s], boxShadow: `inset 0 2px 0 ${scenarioColor[s]}` } : undefined}>
              <div className="mb-3 flex items-center justify-between">
                <span className="num text-sm font-semibold uppercase tracking-wider" style={{ color: scenarioColor[s] }}>{s} Case</span>
                {s === scenario && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Active</span>}
              </div>
              <div className="num text-2xl">{fmtInr(m.end.eps)}</div>
              <div className="text-xs text-muted-foreground">FY28 EPS · Net Profit ₹{fmtCr(m.end.netProfit)} Cr</div>
              <dl className="num mt-3 space-y-1 text-[11px]">
                <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Growth FY26–28</dt><dd>{a.revenueGrowth.map((g) => (g * 100).toFixed(1)).join(" / ")}%</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-muted-foreground">EBITDA margin</dt><dd>{a.ebitdaMargin.map((g) => (g * 100).toFixed(1)).join(" / ")}%</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Tax rate</dt><dd>{fmtPct(a.taxRate)}</dd></div>
              </dl>
            </button>
          );
        })}
      </div>

      <Panel title="Scenario Comparison — FY2028 Projections" subtitle="Computed with the full forecast engine (FY26→FY28 year-by-year)">
        <div className="-mx-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">Metric</th>
                {SCENARIOS.map((s) => (
                  <th key={s} className={cn("px-4 py-2 text-right font-medium", s === scenario && "bg-accent")} style={{ color: scenarioColor[s] }}>{s}</th>
                ))}
                <th className="px-4 py-2 text-right font-medium">Bull vs Bear</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.label} className="border-b border-border/50 hover:bg-accent/40">
                  <td className="px-4 py-2">{m.label}</td>
                  {SCENARIOS.map((s) => (
                    <td key={s} className={cn("num px-4 py-2 text-right", s === scenario && "bg-accent")}>{m.f(m.get(s))}</td>
                  ))}
                  <td className="px-4 py-2 text-right">
                    {m.pct ? <Delta v={m.get("Bull") - m.get("Bear")} pp /> : <Delta v={m.get("Bull") / m.get("Bear") - 1} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Revenue Path by Scenario" subtitle="₹ Crore">
          <TrendChart data={path} forecastStart="FY2026" series={series} />
        </Panel>
        <Panel title="Net Profit Path by Scenario" subtitle="₹ Crore">
          <TrendChart data={npPath} forecastStart="FY2026" series={series} />
        </Panel>
      </div>
      <Panel className="mt-4" title="FY2028 Scenario Outcomes" subtitle="₹ Crore">
        <GroupedBars data={bars} series={SCENARIOS.map((s) => ({ key: s, name: s, color: scenarioColor[s] }))} />
      </Panel>
      <div className="mt-4">
        <Note tone="warn">
          The workbook's static "Scenario Comparison – FY2028" table on the Dashboard uses shortcut formulas (FY26 margin applied to FY28 revenue; Bull uses a hard-coded 31%), so its Net Profit/EPS/EBITDA differ from the year-by-year forecast. This app uses the forecast engine for all scenarios. Both sets of values are shown on the Model Validation page.
        </Note>
      </div>
    </>
  );
}
