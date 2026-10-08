import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, XCircle } from "lucide-react";
import { useModel } from "@/model/ModelProvider";
import { INCONSISTENCY_REPORT, SCENARIOS, WORKBOOK_FY28_TABLE, SOURCE_ASSUMPTIONS } from "@/model/data";
import { runModel } from "@/model/engine";
import { fmtCr, fmtInr, fmtPct } from "@/model/format";
import { KpiCard, Note, PageHeader, Panel, ScenarioBadge, scenarioColor } from "@/components/terminal/ui";
import { cn } from "@/lib/utils";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/validation")({
  head: () => pageMeta("Model Validation", "Live evaluation of the 11 automated integrity checks from the TCS model, plus the workbook's inconsistency report."),
  component: Validation,
});

function Validation() {
  const { checks } = useModel();
  const passed = checks.filter((c) => c.pass).length;
  const ok = passed === checks.length;
  const engine = Object.fromEntries(SCENARIOS.map((s) => [s, runModel(SOURCE_ASSUMPTIONS[s])]));

  return (
    <>
      <PageHeader eyebrow="09 · Integrity" title="Model Validation" right={<ScenarioBadge />}>
        The 11 automated checks from the Validation sheet, re-evaluated live against the current scenario and assumptions.
      </PageHeader>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className={cn("rounded border p-4", ok ? "border-positive/50 bg-positive/5" : "border-negative/50 bg-negative/5")}>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Overall status</div>
          <div className={cn("num mt-1 text-2xl", ok ? "text-positive" : "text-negative")}>{passed} / {checks.length} Checks Passed</div>
        </div>
        <KpiCard label="Passed" value={String(passed)} />
        <KpiCard label="Failed" value={String(checks.length - passed)} />
      </div>

      <Panel title="Automated Checks" subtitle="Validation!B9:G19" bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">#</th>
                <th className="px-4 py-2 text-left font-medium">Validation Check</th>
                <th className="px-4 py-2 text-left font-medium">Condition</th>
                <th className="px-4 py-2 text-left font-medium">Result</th>
                <th className="px-4 py-2 text-left font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="num px-4 py-2 text-muted-foreground">{c.id}</td>
                  <td className="px-4 py-2">{c.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{c.condition}</td>
                  <td className="px-4 py-2">
                    <span className={cn("num inline-flex items-center gap-1 text-xs", c.pass ? "text-positive" : "text-negative")}>
                      {c.pass ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {c.pass ? "PASS" : "FAIL"}
                    </span>
                  </td>
                  <td className="num px-4 py-2 text-xs text-muted-foreground">{c.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel className="mt-4" title="Workbook Dashboard FY28 table vs forecast engine" subtitle="Source values (static) compared with the year-by-year engine using unmodified source assumptions" bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">Scenario</th>
                <th className="px-4 py-2 text-right font-medium">Revenue (WB / Engine)</th>
                <th className="px-4 py-2 text-right font-medium">EBITDA (WB / Engine)</th>
                <th className="px-4 py-2 text-right font-medium">Net Profit (WB / Engine)</th>
                <th className="px-4 py-2 text-right font-medium">EPS (WB / Engine)</th>
                <th className="px-4 py-2 text-left font-medium">Workbook formula note</th>
              </tr>
            </thead>
            <tbody>
              {SCENARIOS.map((s) => {
                const w = WORKBOOK_FY28_TABLE[s];
                const e = engine[s]!.end;
                const cell = (a: string, b: string) => (
                  <td className="num px-4 py-2 text-right">
                    {a} <span className="text-muted-foreground">/</span> <span className={a === b ? "text-positive" : "text-warning"}>{b}</span>
                  </td>
                );
                return (
                  <tr key={s} className="border-b border-border/50">
                    <td className="num px-4 py-2" style={{ color: scenarioColor[s] }}>{s}</td>
                    {cell(fmtCr(w.revenue), fmtCr(e.revenue))}
                    {cell(fmtCr(w.ebitda), fmtCr(e.ebitda))}
                    {cell(fmtCr(w.netProfit), fmtCr(e.netProfit))}
                    {cell(fmtInr(w.eps), fmtInr(e.eps))}
                    <td className="px-4 py-2 text-xs text-muted-foreground">{w.formulaNote}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4">
          <Note tone="warn">
            Revenue and 3Y CAGR match exactly ({SCENARIOS.map((s) => `${s} ${fmtPct(WORKBOOK_FY28_TABLE[s].cagr)}`).join(", ")}). EBITDA, Net Profit and EPS differ because the workbook's comparison table applies a single margin instead of the FY28 margin from the Assumptions sheet. Identified, not altered: the app displays engine values everywhere else.
          </Note>
        </div>
      </Panel>

      <Panel className="mt-4" title="Data Inconsistency Report" subtitle="Static review notes recorded in the workbook (Validation!B22:G35)" bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">#</th>
                <th className="px-4 py-2 text-left font-medium">Issue</th>
                <th className="px-4 py-2 text-left font-medium">Location</th>
                <th className="px-4 py-2 text-left font-medium">Values</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {INCONSISTENCY_REPORT.map((r, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="num px-4 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2">{r.issue}</td>
                  <td className="num px-4 py-2 text-xs text-muted-foreground">{r.location}</td>
                  <td className="num px-4 py-2 text-xs">{r.values}</td>
                  <td className="num px-4 py-2 text-xs text-positive">{r.status}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{r.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-2 p-4">
          <Note tone="warn">
            Some report rows are stale relative to the current workbook: #11 lists FCF FY25 as 47,656 Cr, while the formula gives 47,776 Cr; #12 and #13 describe the Bull case (255,324 × 1.12; CAGR 0.13). They are shown as recorded, not as live checks.
          </Note>
        </div>
      </Panel>
    </>
  );
}
