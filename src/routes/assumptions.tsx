import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RotateCcw, Lock } from "lucide-react";
import { useModel } from "@/model/ModelProvider";
import { SCENARIOS, SOURCE_ASSUMPTIONS, ASSUMPTION_NOTES, HISTORICAL, type ScenarioAssumptions, type ScenarioName } from "@/model/data";
import { fmtCr, fmtInr, fmtPct } from "@/model/format";
import { Note, PageHeader, Panel, ScenarioSelector, scenarioColor } from "@/components/terminal/ui";
import { cn } from "@/lib/utils";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/assumptions")({
  head: () => pageMeta("Assumptions", "Scenario parameters of the TCS forecast model — revenue growth, EBITDA margin, tax, depreciation, capex, shares — editable live."),
  component: Assumptions,
});

function NumInput({ value, onChange, pct = true, changed, label }: { value: number; onChange: (v: number) => void; pct?: boolean; changed: boolean; label: string }) {
  const toText = (v: number) => (pct ? (v * 100).toFixed(1) : String(v));
  const [text, setText] = useState(toText(value));
  useEffect(() => setText(toText(value)), [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="relative inline-flex">
      <input
        aria-label={label}
        inputMode="decimal"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const n = Number(e.target.value);
          if (e.target.value.trim() !== "" && Number.isFinite(n) && (pct || n > 0)) onChange(pct ? n / 100 : n);
        }}
        onBlur={() => setText(toText(value))}
        className={cn("num h-9 w-20 rounded border bg-background pr-6 text-right text-sm outline-none focus:ring-1 focus:ring-warning", changed ? "border-warning text-warning" : "text-foreground")}
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{pct ? "%" : "Cr"}</span>
    </div>
  );
}

type Field = { label: string; get: (a: ScenarioAssumptions) => number; set: (a: ScenarioAssumptions, v: number) => Partial<ScenarioAssumptions>; note: string; pct?: boolean; used: boolean };

const yr = (k: "revenueGrowth" | "ebitdaMargin", i: number) => (a: ScenarioAssumptions, v: number) => {
  const arr = [...a[k]] as [number, number, number];
  arr[i] = v;
  return { [k]: arr } as Partial<ScenarioAssumptions>;
};

const FIELDS: { group: string; fields: Field[] }[] = [
  { group: "Revenue Growth", fields: [0, 1, 2].map((i) => ({ label: `Revenue Growth FY${26 + i}`, get: (a: ScenarioAssumptions) => a.revenueGrowth[i]!, set: yr("revenueGrowth", i), note: ASSUMPTION_NOTES.revenueGrowth[i]!, used: true })) },
  { group: "EBITDA Margin", fields: [0, 1, 2].map((i) => ({ label: `EBITDA Margin FY${26 + i}`, get: (a: ScenarioAssumptions) => a.ebitdaMargin[i]!, set: yr("ebitdaMargin", i), note: ASSUMPTION_NOTES.ebitdaMargin[i]!, used: true })) },
  {
    group: "Tax, Depreciation & Capex",
    fields: [
      { label: "Tax Rate", get: (a) => a.taxRate, set: (_a, v) => ({ taxRate: v }), note: ASSUMPTION_NOTES.taxRate, used: true },
      { label: "Depreciation (% of Rev)", get: (a) => a.depreciationPct, set: (_a, v) => ({ depreciationPct: v }), note: ASSUMPTION_NOTES.depreciationPct, used: true },
      { label: "Capex (% of Rev)", get: (a) => a.capexPct, set: (_a, v) => ({ capexPct: v }), note: ASSUMPTION_NOTES.capexPct, used: true },
    ],
  },
  {
    group: "Share Count & Reference",
    fields: [
      { label: "Shares Outstanding", get: (a) => a.shares, set: (_a, v) => ({ shares: v }), note: ASSUMPTION_NOTES.shares, pct: false, used: true },
      { label: "Implied Net Profit Margin (Est.)", get: (a) => a.impliedNpMargin, set: (_a, v) => ({ impliedNpMargin: v }), note: ASSUMPTION_NOTES.impliedNpMargin, used: false },
    ],
  },
];

function Assumptions() {
  const { assumptions, updateAssumption, resetAssumptions, isModified, scenario, customGrowth, setCustomGrowth, model } = useModel();
  const [cg, setCg] = useState(customGrowth ? (customGrowth * 100).toFixed(1) : "");
  useEffect(() => setCg(customGrowth ? (customGrowth * 100).toFixed(1) : ""), [customGrowth]);
  const L = HISTORICAL.revenue.length - 1;

  return (
    <>
      <PageHeader
        eyebrow="08 · Inputs"
        title="Model Assumptions"
        right={
          <div className="flex flex-wrap items-center gap-2">
            <ScenarioSelector />
            <button onClick={resetAssumptions} disabled={!isModified} className="inline-flex h-10 items-center gap-2 rounded border px-3 text-xs disabled:opacity-40 hover:bg-accent">
              <RotateCcw className="h-3.5 w-3.5" /> Reset to source
            </button>
          </div>
        }
      >
        Values from the Assumptions sheet (amber = input). Edit any cell — every chart, KPI, scenario, sensitivity and validation check updates instantly. Edited cells are highlighted; reset restores the workbook values.
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Panel title="Custom Growth Override" subtitle="Dashboard!C6 — uniform growth for FY26–FY28 on the active scenario. Leave blank or 0 to use scenario rates.">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  aria-label="Custom growth override"
                  inputMode="decimal"
                  placeholder="0"
                  value={cg}
                  onChange={(e) => {
                    setCg(e.target.value);
                    const n = Number(e.target.value);
                    if (e.target.value.trim() === "") setCustomGrowth(0);
                    else if (Number.isFinite(n)) setCustomGrowth(n / 100);
                  }}
                  className={cn("num h-10 w-28 rounded border bg-background pr-7 text-right text-sm outline-none focus:ring-1 focus:ring-warning", customGrowth ? "border-warning text-warning" : "")}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
              </div>
              <span className={cn("text-sm", customGrowth ? "text-warning" : "text-muted-foreground")}>
                Active mode: {customGrowth ? `CUSTOM (${fmtPct(customGrowth)})` : `${scenario} Case`}
              </span>
            </div>
          </Panel>

          {FIELDS.map((g) => (
            <Panel key={g.group} title={g.group} bodyClass="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-2 text-left font-medium">Parameter</th>
                      {SCENARIOS.map((s) => (
                        <th key={s} className={cn("px-3 py-2 text-right font-medium", s === scenario && "bg-accent")} style={{ color: scenarioColor[s] }}>{s}</th>
                      ))}
                      <th className="px-4 py-2 text-left font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.fields.map((f) => (
                      <tr key={f.label} className="border-b border-border/50">
                        <td className="px-4 py-2">
                          {f.label}
                          {!f.used && <span className="ml-2 rounded-sm bg-muted px-1 text-[9px] uppercase tracking-wider text-muted-foreground">reference only</span>}
                        </td>
                        {SCENARIOS.map((s: ScenarioName) => (
                          <td key={s} className={cn("px-3 py-1.5 text-right", s === scenario && "bg-accent")}>
                            <NumInput label={`${f.label} ${s}`} pct={f.pct !== false} value={f.get(assumptions[s])} changed={f.get(assumptions[s]) !== f.get(SOURCE_ASSUMPTIONS[s])} onChange={(v) => updateAssumption(s, f.set(assumptions[s], v))} />
                          </td>
                        ))}
                        <td className="max-w-[260px] px-4 py-2 text-xs text-muted-foreground">{f.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          ))}
          <Note>The "Implied Net Profit Margin" row is an estimate recorded in the workbook but is not referenced by any forecast formula; editing it has no effect on outputs. Capex 2.5% is hard-coded in the Forecast_Model formulas and is exposed here as an editable input for transparency.</Note>
        </div>

        <div className="space-y-4">
          <Panel title={<span className="flex items-center gap-2"><Lock className="h-3.5 w-3.5" />Historical Data (locked)</span>} subtitle="FY2025 base year">
            <dl className="space-y-1.5 text-sm">
              {[
                ["Revenue", `₹${fmtCr(HISTORICAL.revenue[L])} Cr`],
                ["EBITDA", `₹${fmtCr(HISTORICAL.ebitda[L])} Cr`],
                ["Net Profit", `₹${fmtCr(HISTORICAL.netProfit[L])} Cr`],
                ["EPS (Diluted)", fmtInr(HISTORICAL.eps[L])],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between"><dt className="text-muted-foreground">{k}</dt><dd className="num">{v}</dd></div>
              ))}
            </dl>
          </Panel>
          <Panel title="Forecast Outputs" subtitle={`FY2028 · ${customGrowth ? "Custom" : scenario}`}>
            <dl className="space-y-1.5 text-sm">
              {[
                ["Revenue", `₹${fmtCr(model.end.revenue)} Cr`],
                ["EBITDA", `₹${fmtCr(model.end.ebitda)} Cr`],
                ["Net Profit", `₹${fmtCr(model.end.netProfit)} Cr`],
                ["EPS", fmtInr(model.end.eps)],
                ["FCF", `₹${fmtCr(model.end.fcf)} Cr`],
                ["3Y Revenue CAGR", fmtPct(model.cagr3y.revenue)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between"><dt className="text-muted-foreground">{k}</dt><dd className="num text-forecast">{v}</dd></div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}
