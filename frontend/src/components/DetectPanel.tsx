import { fmtDate } from "../utils/format";
import type { SecuritySummary } from "../types";

interface DetectPanelProps {
  summary: SecuritySummary | null;
}

const levelStyle: Record<string, string> = {
  low: "bg-sky-500/15 text-sky-300 border-sky-500/20",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  high: "bg-rose-500/15 text-rose-300 border-rose-500/20 alert-glow",
};

export function DetectPanel({ summary }: DetectPanelProps) {
  return (
    <section className="glass-card panel-shell panel-inner-glow fade-in-up rounded-3xl p-5 transition-all duration-500 hover:-translate-y-1">
      <div className="relative mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Detection</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Alert feed</h2>
        </div>
        <span className="status-pill">Updated {fmtDate(summary?.generatedAt || "")}</span>
      </div>
      <div className="relative space-y-3">
        {(summary?.events || []).map((event) => (
          <div
            className={`rounded-2xl border px-4 py-3 transition-all duration-300 ${levelStyle[event.level] || levelStyle.low}`}
            key={event.id}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{event.title}</p>
              <span className="text-[10px] uppercase tracking-[0.18em]">{event.level}</span>
            </div>
            <p className="mt-2 text-sm opacity-90">{event.detail}</p>
          </div>
        ))}
        {!summary && <p className="text-sm text-slate-400">Loading detection feed...</p>}
      </div>
    </section>
  );
}
