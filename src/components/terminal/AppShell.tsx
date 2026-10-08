import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, X, Download } from "lucide-react";
import { SCENARIOS, type ScenarioName } from "@/model/data";

const MODEL_FILE_URL = "https://www.dropbox.com/scl/fi/l1uh8zbgyg87jl9hrc7nd/TCS.xlsx?rlkey=6ud0c886omvs9iukxw2kt5iv8&st=f2st5sni&dl=1";
const TRIED_KEY = "tcs-tried-scenarios";

/** Unlocks the workbook download only after all three scenarios have been explored. */
function useScenariosTried(scenario: ScenarioName) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    let seen: string[] = [];
    try { seen = JSON.parse(localStorage.getItem(TRIED_KEY) || "[]"); } catch { seen = []; }
    if (!seen.includes(scenario)) seen.push(scenario);
    localStorage.setItem(TRIED_KEY, JSON.stringify(seen));
    setDone(SCENARIOS.every((s) => seen.includes(s)));
  }, [scenario]);
  return done;
}
import { useModel } from "@/model/ModelProvider";
import { ScenarioSelector } from "./ui";
import { cn } from "@/lib/utils";

export const NAV = [
  { to: "/", label: "Overview", short: "Overview" },
  { to: "/historical", label: "Historical Financials", short: "Historical" },
  { to: "/forecast", label: "Forecast", short: "Forecast" },
  { to: "/scenarios", label: "Scenarios", short: "Scenarios" },
  { to: "/valuation", label: "Valuation", short: "Valuation" },
  { to: "/sensitivity", label: "Sensitivity Analysis", short: "Sensitivity" },
  { to: "/statements", label: "Financial Statements", short: "Statements" },
  { to: "/assumptions", label: "Assumptions", short: "Assumptions" },
  { to: "/validation", label: "Model Validation", short: "Validation" },
  { to: "/methodology", label: "Methodology", short: "Methodology" },
] as const;

function NavList({ onNavigate, horizontal }: { onNavigate?: () => void; horizontal?: boolean }) {
  const { checks } = useModel();
  const passed = checks.filter((c) => c.pass).length;
  return (
    <nav className={horizontal ? "flex gap-0 overflow-x-auto" : "flex flex-col p-2"}>
      {NAV.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          onClick={onNavigate}
          activeOptions={{ exact: n.to === "/" }}
          className={
            horizontal
              ? "flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-3 py-3 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              : "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          }
          activeProps={{ className: horizontal ? "!border-primary !text-primary font-medium" : "bg-sidebar-accent !text-sidebar-foreground" }}
        >
          <span className="flex-1">{horizontal ? n.short : n.label}</span>
          {n.to === "/validation" && (
            <span className={cn("num text-[10px]", passed === checks.length ? "text-positive" : "text-negative")}>
              {passed}/{checks.length}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[15px] font-semibold tracking-tight">TCS Financial Analysis</span>
      <span className="hidden text-xs text-sidebar-foreground/60 sm:inline">Forecasting Model · FY2018–FY2028</span>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { isModified, customGrowth, scenario } = useModel();
  const unlocked = useScenariosTried(scenario);

  return (
    <div className="min-h-screen">
      <header className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 lg:px-8">
          <button aria-label="Open menu" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-sm border border-sidebar-border lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1"><Brand /></div>
          <span className="hidden text-[11px] text-sidebar-foreground/60 md:inline">Independent academic project · ₹ Crore</span>
        </div>
      </header>

      <div className="sticky top-0 z-40 border-b bg-panel">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 lg:px-8">
          <div className="hidden min-w-0 flex-1 lg:block"><NavList horizontal /></div>
          <div className="flex flex-1 items-center justify-end gap-2 py-2 lg:flex-none">
            {isModified && (
              <span className="rounded-sm border border-warning/40 bg-warning/10 px-2 py-1 text-[11px] text-warning">
                {customGrowth !== 0 ? "Custom growth" : "Inputs modified"}
              </span>
            )}
            <span className="hidden text-[11px] text-muted-foreground sm:inline">Scenario</span>
            <ScenarioSelector compact />
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar text-sidebar-foreground">
            <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
              <span className="text-sm font-semibold">TCS Financial Analysis</span>
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-sm hover:bg-sidebar-accent">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavList onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
        {unlocked && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-positive/40 bg-panel px-4 py-3">
            <div className="text-sm">
              <span className="font-semibold text-primary">You have explored all three scenarios.</span>{" "}
              <span className="text-muted-foreground">The original Excel model behind this site is now available.</span>
            </div>
            <a href={MODEL_FILE_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-sm bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90">
              <Download className="h-3.5 w-3.5" /> Download TCS model (.xlsx)
            </a>
          </div>
        )}
        {children}
      </main>
      <footer className="border-t bg-panel">
        <div className="mx-auto max-w-[1400px] px-4 py-5 text-xs leading-relaxed text-muted-foreground lg:px-8">
          This is an independent academic financial analysis and forecasting model. Forecasts and valuations are based on stated assumptions and should not be interpreted as investment advice or official guidance from Tata Consultancy Services. Historical data: TCS Annual Reports FY18–FY25 (as recorded in the source model).
        </div>
      </footer>
    </div>
  );
}
