import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { SOURCES, SOURCE_DATAPOINTS, MODEL_NOTES } from "@/model/data";
import { Note, PageHeader, Panel } from "@/components/terminal/ui";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/methodology")({
  head: () => pageMeta("Methodology", "How the TCS forecasting model works: forecasting chain, periods, scenario logic, sources and limitations."),
  component: Methodology,
});

const CHAIN = [
  ["FY2025 Revenue (actual)", "Base year from Historical_Data"],
  ["× (1 + Revenue Growth %)", "Per year, per scenario (or custom override)"],
  ["= Revenue", "FY26 → FY27 → FY28, compounding"],
  ["× EBITDA Margin %", "Per year, per scenario"],
  ["= EBITDA", ""],
  ["− Depreciation (Revenue × Depr %)", ""],
  ["= EBIT", ""],
  ["− Tax (EBIT × Tax Rate)", ""],
  ["= Net Profit", "Other Income not modelled"],
  ["÷ Shares Outstanding (362 Cr)", "→ EPS"],
  ["+ Depreciation − Capex (2.5% of Revenue)", "→ Free Cash Flow"],
];

function Methodology() {
  return (
    <>
      <PageHeader eyebrow="10 · Methodology" title="How the Model Works">
        An independent academic financial analysis and forecasting project. Not professional investment research, not TCS internal analysis, and not official TCS guidance.
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Forecasting Chain" subtitle="Forecast_Model sheet">
          <ol className="relative space-y-1">
            {CHAIN.map(([k = "", v], i) => (
              <li key={i} className="flex items-baseline gap-3 rounded px-2 py-1.5 hover:bg-accent/40">
                <span className="num w-5 shrink-0 text-[10px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span className={k.startsWith("=") ? "num font-medium text-forecast" : "num text-sm"}>{k}</span>
                {v && <span className="ml-auto text-right text-xs text-muted-foreground">{v}</span>}
              </li>
            ))}
          </ol>
        </Panel>
        <div className="space-y-4">
          <Panel title="Periods">
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li><span className="text-foreground">Historical:</span> FY2018–FY2025 (8 years), TCS Annual Reports.</li>
              <li><span className="text-foreground">Forecast:</span> FY2026–FY2028 (3 years).</li>
              <li><span className="text-foreground">Units:</span> ₹ Crore; EPS in ₹; shares in Crore.</li>
              <li><span className="text-foreground">Model created:</span> April 2025.</li>
            </ul>
          </Panel>
          <Panel title="Scenario Methodology">
            <p className="text-sm text-muted-foreground">
              Three parameter sets (Base, Bull, Bear) are stored side by side. A scenario selector picks one column via an index (MATCH/CHOOSE). A custom growth override, when non-zero, replaces all three years' growth rates for the active scenario. The workbook was saved with the Bear case selected; this app opens on Base.
            </p>
          </Panel>
          <Panel title="Valuation Methodology">
            <p className="text-sm text-muted-foreground">The source model has no DCF or multiple-based valuation. Forecast EPS and FCF are its terminal outputs.</p>
          </Panel>
        </div>
      </div>

      <Panel className="mt-4" title="Limitations">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>Forecast Net Profit = EBIT − Tax, excluding Other Income; forecast net margins are therefore structurally lower than historical net margins.</li>
          <li>Capex is a fixed 2.5% of revenue for all scenarios (hard-coded in formulas).</li>
          <li>Shares outstanding are held constant at 362 Cr; forecast EPS is not a diluted-weighted figure.</li>
          <li>No balance sheet, working capital, or full cash flow statement is modelled.</li>
          <li>{MODEL_NOTES.tax}</li>
          <li>Forecasts are estimates based on historical trends and analyst assumptions — not official TCS guidance.</li>
        </ul>
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Primary Data Sources" subtitle="Sources sheet · last accessed Apr-26">
          <ul className="divide-y divide-border/50 text-sm">
            {SOURCES.map((s, i) => (
              <li key={s.name} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <span className="num w-5 text-xs text-muted-foreground">{i + 1}</span>
                <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                  {s.name} <ExternalLink className="h-3 w-3" />
                </a>
                <span className="text-xs text-muted-foreground">{s.type}</span>
                <span className="num ml-auto text-xs text-muted-foreground">{s.period}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Other FY2025 Data Points" subtitle="Recorded in Sources sheet">
          <dl className="space-y-2 text-sm">
            {SOURCE_DATAPOINTS.map((d) => (
              <div key={d.metric} className="border-b border-border/50 pb-2">
                <div className="flex justify-between"><dt>{d.metric}</dt><dd className="num">{d.value}</dd></div>
                <div className="text-xs text-muted-foreground">{d.note} · Source #{d.source}</div>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      <div className="mt-4">
        <Note tone="warn">
          This is an independent academic financial analysis and forecasting model. Forecasts and valuations are based on stated assumptions and should not be interpreted as investment advice or official guidance from Tata Consultancy Services.
        </Note>
      </div>
    </>
  );
}
