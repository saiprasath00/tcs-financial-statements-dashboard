import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useModel } from "@/model/ModelProvider";
import { sensitivityGrid, type SensMetric } from "@/model/engine";
import { fmtCr, fmtInr, fmtPct } from "@/model/format";
import { Note, PageHeader, Panel, ScenarioBadge, Seg } from "@/components/terminal/ui";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/sensitivity")({
  head: () => pageMeta("Sensitivity Analysis", "Revenue growth vs EBITDA margin sensitivity of FY2028 EPS, net profit and FCF, derived from the TCS model's forecast engine."),
  component: Sensitivity,
});

const METRICS: { value: SensMetric; label: string }[] = [
  { value: "eps", label: "FY28 EPS" },
  { value: "netProfit", label: "FY28 Net Profit" },
  { value: "fcf", label: "FY28 FCF" },
  { value: "revenue", label: "FY28 Revenue" },
];

function Sensitivity() {
  const { active, customGrowth, model } = useModel();
  const [metric, setMetric] = useState<SensMetric>("eps");
  const [step, setStep] = useState("0.01");
  const s = Number(step);
  const shifts = [-2, -1, 0, 1, 2].map((k) => k * s);
  const grid = sensitivityGrid(active, customGrowth, shifts, shifts, metric);
  const center = grid[2]![2]!;
  const f = (v: number) => (metric === "eps" ? fmtInr(v) : fmtCr(v));
  const flat = grid.flat();
  const max = Math.max(...flat.map((v) => Math.abs(v / center - 1))) || 1;
  const growthLabels = model.fc.map((r) => r.revenueGrowth ?? 0);

  return (
    <>
      <PageHeader eyebrow="06 · Sensitivity" title="Sensitivity Analysis" right={<ScenarioBadge />}>
        Revenue growth vs EBITDA margin, re-running the full forecast engine for each cell.
      </PageHeader>
      <div className="mb-4">
        <Note tone="warn">
          The source workbook does not contain a sensitivity table. This grid is a derived calculation: it applies uniform shifts to the active scenario's FY26–FY28 revenue growth and EBITDA margin inputs and recomputes using the model's own formulas. No new assumptions are introduced.
        </Note>
      </div>

      <Panel
        title={`${METRICS.find((m) => m.value === metric)!.label} — Growth shift (rows) × EBITDA margin shift (columns)`}
        subtitle={`Centre = active case: growth ${growthLabels.map((g) => fmtPct(g)).join(" / ")}, margin ${active.ebitdaMargin.map((m) => fmtPct(m)).join(" / ")}`}
        right={
          <div className="flex flex-wrap gap-2">
            <Seg label="Output" value={metric} onChange={setMetric} options={METRICS} />
            <Seg label="Step" value={step} onChange={setStep} options={[{ value: "0.005", label: "±0.5pp" }, { value: "0.01", label: "±1pp" }, { value: "0.02", label: "±2pp" }]} />
          </div>
        }
      >
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[560px] border-separate border-spacing-1 text-sm">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Growth ↓ / Margin →</th>
                {shifts.map((m) => (
                  <th key={m} className="num px-2 py-1 text-right text-xs font-medium text-muted-foreground">{m === 0 ? "Active" : `${m > 0 ? "+" : ""}${(m * 100).toFixed(1)}pp`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row, i) => (
                <tr key={i}>
                  <th className="num px-2 py-1 text-left text-xs font-medium text-muted-foreground">{shifts[i]! === 0 ? "Active" : `${shifts[i]! > 0 ? "+" : ""}${(shifts[i]! * 100).toFixed(1)}pp`}</th>
                  {row.map((v, j) => {
                    const d = v / center - 1;
                    const isC = i === 2 && j === 2;
                    const alpha = Math.min(0.55, (Math.abs(d) / max) * 0.55);
                    return (
                      <td
                        key={j}
                        title={`${(d * 100).toFixed(1)}% vs active`}
                        className={`num rounded-sm px-2 py-2.5 text-right ${isC ? "outline outline-1 outline-primary" : ""}`}
                        style={{ background: isC ? "var(--accent)" : `color-mix(in oklch, ${d >= 0 ? "var(--positive)" : "var(--negative)"} ${alpha * 100}%, transparent)` }}
                      >
                        <div>{f(v)}</div>
                        <div className="text-[10px] text-muted-foreground">{isC ? "base" : `${d >= 0 ? "+" : ""}${(d * 100).toFixed(1)}%`}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-positive/50" />Upside vs active</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-negative/50" />Downside vs active</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm outline outline-1 outline-primary" />Active case</span>
        </div>
      </Panel>
    </>
  );
}
