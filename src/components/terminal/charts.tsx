import { useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, BarChart } from "recharts";
import { fmtCr, fmtPct, fmtShort } from "@/model/format";

export type Fmt = "cr" | "pct" | "inr";
const tick = { fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "IBM Plex Mono" };
export const fmtBy = (f: Fmt) => (v: number) => (f === "pct" ? fmtPct(v) : f === "inr" ? `₹${v.toFixed(2)}` : `₹${fmtCr(v)} Cr`);
const axisBy = (f: Fmt) => (v: number) => (f === "pct" ? `${(v * 100).toFixed(0)}%` : f === "inr" ? `₹${v.toFixed(0)}` : fmtShort(v));

export interface SeriesDef {
  key: string;
  name: string;
  color: string;
  type?: "bar" | "line";
  dashed?: boolean;
  axis?: "left" | "right";
}

function TipBox({ active, payload, label, format, rightFormat, forecastStart }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border bg-popover px-3 py-2 text-xs shadow-lg">
      <div className="num mb-1 flex items-center gap-2 font-medium">
        {label}
        {forecastStart && <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{payload[0]?.payload?.isForecast ? "Forecast" : "Actual"}</span>}
      </div>
      {payload
        .filter((p: any) => p.value != null)
        .map((p: any) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-sm" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="num">{fmtBy(p.payload.__axis?.[p.dataKey] === "right" ? rightFormat : format)(p.value)}</span>
          </div>
        ))}
    </div>
  );
}

/**
 * Time-series chart with actual/forecast distinction: forecast region is shaded,
 * forecast bars are drawn translucent. Legend click toggles series.
 */
export function TrendChart({ data, series, format = "cr", rightFormat = "pct", height = 280, forecastStart }: { data: any[]; series: SeriesDef[]; format?: Fmt; rightFormat?: Fmt; height?: number; forecastStart?: string }) {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const axisMap = Object.fromEntries(series.map((s) => [s.key, s.axis ?? "left"]));
  const rows = data.map((d) => ({ ...d, __axis: axisMap }));
  const hasRight = series.some((s) => s.axis === "right");
  const lastYear = data[data.length - 1]?.year;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <ComposedChart data={rows} margin={{ top: 8, right: hasRight ? 0 : 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
          {forecastStart && <ReferenceArea x1={forecastStart} x2={lastYear} fill="var(--forecast)" fillOpacity={0.06} label={{ value: "FORECAST", position: "insideTopRight", fill: "var(--forecast)", fontSize: 10, fontFamily: "IBM Plex Mono" }} />}
          <XAxis dataKey="year" tick={tick} tickFormatter={(y: string) => y.replace("FY20", "FY")} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
          <YAxis yAxisId="left" tick={tick} tickFormatter={axisBy(format)} axisLine={false} tickLine={false} width={48} />
          {hasRight && <YAxis yAxisId="right" orientation="right" tick={tick} tickFormatter={axisBy(rightFormat)} axisLine={false} tickLine={false} width={44} />}
          <Tooltip content={<TipBox format={format} rightFormat={rightFormat} forecastStart={forecastStart} />} cursor={{ fill: "var(--accent)", fillOpacity: 0.4 }} />
          <Legend
            wrapperStyle={{ fontSize: 11, cursor: "pointer" }}
            onClick={(e: any) => setHidden((h) => ({ ...h, [e.dataKey]: !h[e.dataKey] }))}
            formatter={(v: string, e: any) => <span style={{ color: hidden[e.dataKey] ? "var(--muted-foreground)" : "var(--foreground)", opacity: hidden[e.dataKey] ? 0.5 : 1 }}>{v}</span>}
          />
          {series.map((s) =>
            s.type === "bar" ? (
              <Bar key={s.key} yAxisId={s.axis ?? "left"} dataKey={s.key} name={s.name} fill={s.color} hide={hidden[s.key]} radius={[2, 2, 0, 0]} maxBarSize={36} isAnimationActive={false}>
                {rows.map((d, i) => (
                  <Cell key={i} fill={s.color} fillOpacity={d.isForecast ? 0.45 : 0.9} stroke={d.isForecast ? s.color : undefined} strokeDasharray={d.isForecast ? "3 2" : undefined} />
                ))}
              </Bar>
            ) : (
              <Line key={s.key} yAxisId={s.axis ?? "left"} dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} strokeDasharray={s.dashed ? "5 4" : undefined} dot={{ r: 2.5, fill: s.color }} hide={hidden[s.key]} connectNulls isAnimationActive={false} />
            ),
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GroupedBars({ data, series, format = "cr", height = 260, xKey = "label" }: { data: any[]; series: SeriesDef[]; format?: Fmt; height?: number; xKey?: string }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey={xKey} tick={tick} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
          <YAxis tick={tick} tickFormatter={axisBy(format)} axisLine={false} tickLine={false} width={48} />
          <Tooltip content={<TipBox format={format} />} cursor={{ fill: "var(--accent)", fillOpacity: 0.4 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[2, 2, 0, 0]} maxBarSize={40} isAnimationActive={false} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
