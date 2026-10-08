import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useModel } from "@/model/ModelProvider";
import { SCENARIOS, type ScenarioName } from "@/model/data";
import { cn } from "@/lib/utils";

export const scenarioColor: Record<ScenarioName, string> = { Bull: "var(--bull)", Base: "var(--base)", Bear: "var(--bear)" };
const scenarioClass: Record<ScenarioName, string> = {
  Bull: "bg-bull/10 text-bull border-bull/40",
  Base: "bg-base/10 text-base border-base/40",
  Bear: "bg-bear/10 text-bear border-bear/40",
};
const scenarioDot: Record<ScenarioName, string> = { Bull: "bg-bull", Base: "bg-base", Bear: "bg-bear" };

export function ScenarioSelector({ compact }: { compact?: boolean }) {
  const { scenario, setScenario } = useModel();
  return (
    <div role="radiogroup" aria-label="Scenario" className="inline-flex items-center rounded-sm border bg-muted p-0.5">
      {SCENARIOS.map((s) => (
        <button
          key={s}
          role="radio"
          aria-checked={scenario === s}
          onClick={() => setScenario(s)}
          className={cn(
            "inline-flex min-h-8 items-center gap-1.5 rounded-[2px] text-xs font-medium transition-colors",
            compact ? "px-2.5" : "px-3",
            scenario === s ? "bg-panel text-foreground shadow-[0_0_0_1px_var(--border)]" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", scenario === s ? scenarioDot[s] : "bg-muted-foreground/40")} />
          {s}
        </button>
      ))}
    </div>
  );
}

export function ScenarioBadge({ s }: { s?: ScenarioName }) {
  const { scenario } = useModel();
  const v = s ?? scenario;
  return <span className={cn("num rounded-sm border px-1.5 py-0.5 text-[10px] uppercase tracking-wider", scenarioClass[v])}>{v} case</span>;
}

export function PeriodTag({ forecast }: { forecast: boolean }) {
  return (
    <span className={cn("num rounded-[2px] px-1 py-px text-[9px] uppercase tracking-wider", forecast ? "bg-forecast/10 text-forecast" : "bg-actual/10 text-actual")}>
      {forecast ? "Forecast" : "Actual"}
    </span>
  );
}

export function PageHeader({ eyebrow, title, children, right }: { eyebrow: string; title: string; children?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b pb-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <div className="mb-1 text-[11px] font-medium text-muted-foreground">{eyebrow}</div>
        <h1 className="text-xl font-semibold tracking-tight text-primary md:text-2xl">{title}</h1>
        {children && <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</div>}
      </div>
      {right}
    </div>
  );
}

export function Panel({ title, subtitle, right, children, className, bodyClass }: { title?: ReactNode; subtitle?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cn("min-w-0 rounded-sm border bg-panel", className)}>
      {(title || right) && (
        <div className="flex flex-wrap items-end justify-between gap-2 border-b px-4 pb-2.5 pt-3">
          <div>
            {title && <h2 className="text-[13px] font-semibold text-primary">{title}</h2>}
            {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      <div className={cn("p-4", bodyClass)}>{children}</div>
    </section>
  );
}

export function KpiCard({ label, value, unit, sub, delta, deltaLabel, forecast }: { label: string; value: string; unit?: string; sub?: ReactNode; delta?: number | null; deltaLabel?: string; forecast?: boolean }) {
  const pos = delta != null && delta >= 0;
  return (
    <div className="min-w-0 rounded-sm border bg-panel px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        {forecast != null && <PeriodTag forecast={forecast} />}
      </div>
      <div className="mt-1.5 truncate text-2xl font-semibold leading-tight tracking-tight tabular-nums">
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>}
      </div>
      {(delta != null || sub) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 text-[11px]">
          {delta != null && Number.isFinite(delta) && (
            <span className={cn("num font-medium", pos ? "text-positive" : "text-negative")}>
              {pos ? "▲" : "▼"} {(Math.abs(delta) * 100).toFixed(1)}%
            </span>
          )}
          {deltaLabel && <span className="text-muted-foreground">{deltaLabel}</span>}
          {sub && <span className="text-muted-foreground">{sub}</span>}
        </div>
      )}
    </div>
  );
}

export function Seg<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap rounded border bg-background p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn("min-h-8 rounded-sm px-2.5 text-xs transition-colors", value === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Note({ tone = "info", children }: { tone?: "info" | "warn"; children: ReactNode }) {
  return (
    <div className={cn("rounded border-l-2 px-3 py-2 text-xs leading-relaxed", tone === "warn" ? "border-warning bg-warning/5 text-warning/90" : "border-forecast/60 bg-panel-2 text-muted-foreground")}>
      {children}
    </div>
  );
}

export function Delta({ v, pp }: { v: number | null | undefined; pp?: boolean }) {
  if (v == null || !Number.isFinite(v)) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={cn("num", v >= 0 ? "text-positive" : "text-negative")}>
      {v >= 0 ? "+" : ""}
      {(v * 100).toFixed(1)}
      {pp ? " pp" : "%"}
    </span>
  );
}

/* ---------- Data table: rows = metrics, cols = years ---------- */
export interface MetricRow {
  label: string;
  values: (string | ReactNode)[];
  emphasis?: boolean;
  muted?: boolean;
}
export function YearTable({ years, forecastFlags, rows, highlight }: { years: string[]; forecastFlags: boolean[]; rows: MetricRow[]; highlight?: number }) {
  return (
    <div className="-mx-4 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-foreground/20 bg-panel-2">
            <th className="sticky left-0 z-10 bg-panel-2 px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">₹ Crore</th>
            {years.map((y, i) => (
              <th key={y} className={cn("px-3 py-2 text-right align-bottom", forecastFlags[i] && "bg-forecast/[0.06]", forecastFlags[i] && !forecastFlags[i - 1] && "border-l border-forecast/50", highlight === i && "bg-accent")}>
                <div className="num text-xs font-medium">{y}</div>
                <div className={cn("num text-[9px] uppercase tracking-wider", forecastFlags[i] ? "text-forecast" : "text-muted-foreground")}>{forecastFlags[i] ? "F" : "A"}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={`${r.label}-${ri}`} className={cn("border-b border-border/60 hover:bg-accent/60", r.emphasis && "font-semibold")}>
              <td className={cn("sticky left-0 z-10 whitespace-nowrap bg-panel px-4 py-2", r.muted ? "pl-7 text-xs text-muted-foreground" : "")}>{r.label}</td>
              {r.values.map((v, i) => (
                <td key={i} className={cn("num whitespace-nowrap px-3 py-2 text-right", r.muted && "text-xs text-muted-foreground", forecastFlags[i] && "bg-forecast/[0.06]", forecastFlags[i] && !forecastFlags[i - 1] && "border-l border-forecast/50", highlight === i && "bg-accent")}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Sortable table (rows = records) ---------- */
export interface Col<T> {
  key: string;
  label: string;
  render: (r: T) => ReactNode;
  sort?: (r: T) => number | string;
  align?: "left" | "right";
}
export function SortTable<T>({ cols, rows, rowClass }: { cols: Col<T>[]; rows: T[]; rowClass?: (r: T) => string }) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const sorted = [...rows];
  if (sort) {
    const c = cols.find((c) => c.key === sort.key);
    if (c?.sort) sorted.sort((a, b) => (c.sort!(a) > c.sort!(b) ? 1 : -1) * sort.dir);
  }
  return (
    <div className="-mx-4 overflow-x-auto">
      <table className="w-full min-w-[600px] border-collapse text-sm">
        <thead>
          <tr className="border-b">
            {cols.map((c) => (
              <th key={c.key} className={cn("px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground", c.align === "left" ? "text-left" : "text-right")}>
                {c.sort ? (
                  <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setSort((s) => ({ key: c.key, dir: s?.key === c.key && s.dir === 1 ? -1 : 1 }))}>
                    {c.label}
                    {sort?.key === c.key ? sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                  </button>
                ) : (
                  c.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={i} className={cn("border-b border-border/50 hover:bg-accent/40", rowClass?.(r))}>
              {cols.map((c) => (
                <td key={c.key} className={cn("whitespace-nowrap px-4 py-2", c.align === "left" ? "text-left" : "num text-right")}>
                  {c.render(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
