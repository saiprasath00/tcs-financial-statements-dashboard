const safe = (v: number | null | undefined) => v != null && Number.isFinite(v);

/** Indian digit grouping (e.g. 2,55,324) — matches workbook "#,##,##0" format. */
export const fmtCr = (v: number | null | undefined, digits = 0) =>
  safe(v) ? (v as number).toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits }) : "—";
export const fmtInr = (v: number | null | undefined) => (safe(v) ? `₹${(v as number).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—");
export const fmtPct = (v: number | null | undefined, digits = 1) => (safe(v) ? `${((v as number) * 100).toFixed(digits)}%` : "—");
export const fmtPp = (v: number | null | undefined) => (safe(v) ? `${(v as number) >= 0 ? "+" : ""}${((v as number) * 100).toFixed(1)} pp` : "—");
export const fmtSignedPct = (v: number | null | undefined) => (safe(v) ? `${(v as number) >= 0 ? "+" : ""}${((v as number) * 100).toFixed(1)}%` : "—");
export const fmtShort = (v: number) => (Math.abs(v) >= 1000 ? `${(v / 1000).toLocaleString("en-IN", { maximumFractionDigits: 0 })}k` : `${v}`);
export const fmt = { n: (v: number) => fmtCr(v), p: (v: number) => fmtPct(v), inr: fmtInr };
