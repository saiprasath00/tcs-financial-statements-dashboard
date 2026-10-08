import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useModel } from "@/model/ModelProvider";
import { SCENARIOS } from "@/model/data";
import { fmtInr } from "@/model/format";
import { Note, PageHeader, Panel, scenarioColor } from "@/components/terminal/ui";
import { GroupedBars } from "@/components/terminal/charts";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/valuation")({
  head: () => pageMeta("Valuation", "Valuation status of the TCS forecasting model, with an optional user-supplied P/E illustration on model EPS."),
  component: Valuation,
});

function Valuation() {
  const { byScenario, scenario } = useModel();
  const [pe, setPe] = useState("");
  const multiple = Number(pe);
  const valid = pe !== "" && Number.isFinite(multiple) && multiple > 0;

  return (
    <>
      <PageHeader eyebrow="05 · Valuation" title="Valuation">
        What the source model contains, and what it does not.
      </PageHeader>

      <Panel title="Valuation methodology in source model" className="mb-4">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["DCF (WACC, Terminal Value, EV → Equity)", "Not present in source model"],
            ["P/E-based valuation (target multiple)", "Not present in source model"],
            ["Other valuation methods", "Not present in source model"],
          ].map(([k, v]) => (
            <div key={k} className="rounded border border-dashed p-4">
              <div className="text-sm">{k}</div>
              <div className="num mt-2 text-xs uppercase tracking-wider text-warning">{v}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          The workbook (Dashboard, Historical_Data, Assumptions, Forecast_Model, Validation, Sources) contains no discount rate, terminal growth, share price, target multiple or per-share value. To avoid fabricating figures, no intrinsic or target value is shown. The model's valuation-relevant outputs are forecast EPS and Free Cash Flow, available below and on the Forecast page.
        </p>
      </Panel>

      <Panel title="Optional: illustrative P/E on model EPS" subtitle="User input — not part of the source model">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="text-xs text-muted-foreground">
            P/E multiple (×)
            <input
              inputMode="decimal"
              value={pe}
              onChange={(e) => setPe(e.target.value)}
              placeholder="Enter a multiple"
              className="num mt-1 block h-10 w-40 rounded border border-warning/50 bg-background px-3 text-sm text-warning outline-none focus:ring-1 focus:ring-warning"
            />
          </label>
          {!valid && <span className="pb-2 text-xs text-muted-foreground">Enter a multiple to compute EPS × P/E. No default is assumed.</span>}
        </div>
        <div className="-mx-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">Scenario</th>
                <th className="px-4 py-2 text-right font-medium">FY26F EPS</th>
                <th className="px-4 py-2 text-right font-medium">FY28F EPS</th>
                <th className="px-4 py-2 text-right font-medium">× P/E</th>
                <th className="px-4 py-2 text-right font-medium">Implied value (FY28 EPS)</th>
              </tr>
            </thead>
            <tbody>
              {SCENARIOS.map((s) => (
                <tr key={s} className={`border-b border-border/50 ${s === scenario ? "bg-accent" : ""}`}>
                  <td className="num px-4 py-2" style={{ color: scenarioColor[s] }}>{s}</td>
                  <td className="num px-4 py-2 text-right">{fmtInr(byScenario[s].fc[0]!.eps)}</td>
                  <td className="num px-4 py-2 text-right">{fmtInr(byScenario[s].end.eps)}</td>
                  <td className="num px-4 py-2 text-right text-warning">{valid ? `${multiple}×` : "—"}</td>
                  <td className="num px-4 py-2 text-right">{valid ? fmtInr(byScenario[s].end.eps * multiple) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {valid && (
          <div className="mt-4">
            <GroupedBars format="inr" data={SCENARIOS.map((s) => ({ label: s, value: byScenario[s].end.eps * multiple }))} series={[{ key: "value", name: `FY28 EPS × ${multiple}`, color: "var(--chart-2)" }]} />
          </div>
        )}
        <div className="mt-3">
          <Note tone="warn">Illustrative only. The multiple is supplied by you and is not a model assumption; the result is not a price target or investment recommendation.</Note>
        </div>
      </Panel>
    </>
  );
}
