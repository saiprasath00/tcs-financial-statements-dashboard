import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { SOURCE_ASSUMPTIONS, SCENARIOS, type ScenarioAssumptions, type ScenarioName } from "./data";
import { runModel, validationChecks, type ModelOutput, type Check } from "./engine";
import { fmt } from "./format";

const clone = (): Record<ScenarioName, ScenarioAssumptions> => JSON.parse(JSON.stringify(SOURCE_ASSUMPTIONS));

interface Ctx {
  scenario: ScenarioName;
  setScenario: (s: ScenarioName) => void;
  customGrowth: number;
  setCustomGrowth: (v: number) => void;
  assumptions: Record<ScenarioName, ScenarioAssumptions>;
  active: ScenarioAssumptions;
  updateAssumption: (s: ScenarioName, patch: Partial<ScenarioAssumptions>) => void;
  resetAssumptions: () => void;
  isModified: boolean;
  model: ModelOutput; // active scenario (incl. custom override)
  byScenario: Record<ScenarioName, ModelOutput>; // each scenario, no custom override (as in Dashboard comparison)
  checks: Check[];
}

const ModelCtx = createContext<Ctx | null>(null);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<ScenarioName>("Base");
  const [customGrowth, setCustomGrowth] = useState(0);
  const [assumptions, setAssumptions] = useState(clone);

  const value = useMemo<Ctx>(() => {
    const active = assumptions[scenario];
    const model = runModel(active, customGrowth);
    const byScenario = Object.fromEntries(SCENARIOS.map((s) => [s, runModel(assumptions[s])])) as Record<ScenarioName, ModelOutput>;
    return {
      scenario,
      setScenario,
      customGrowth,
      setCustomGrowth,
      assumptions,
      active,
      updateAssumption: (s, patch) => setAssumptions((prev) => ({ ...prev, [s]: { ...prev[s], ...patch } })),
      resetAssumptions: () => {
        setAssumptions(clone());
        setCustomGrowth(0);
      },
      isModified: customGrowth !== 0 || JSON.stringify(assumptions) !== JSON.stringify(SOURCE_ASSUMPTIONS),
      model,
      byScenario,
      checks: validationChecks(model, active, scenario, customGrowth, fmt),
    };
  }, [scenario, customGrowth, assumptions]);

  return <ModelCtx.Provider value={value}>{children}</ModelCtx.Provider>;
}

export function useModel() {
  const c = useContext(ModelCtx);
  if (!c) throw new Error("useModel must be used within ModelProvider");
  return c;
}
