import type { SecuritySummary } from "../types";

interface SecurityOverviewCardsProps {
  summary: SecuritySummary | null;
}

function Card({ title, value, hint, tone }: { title: string; value: string | number; hint: string; tone: string }) {
  return (
    <div className={`glass-card panel-shell fade-in-up rounded-3xl p-5 ${tone}`}>
      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{hint}</p>
    </div>
  );
}

export function SecurityOverviewCards({ summary }: SecurityOverviewCardsProps) {
  if (!summary) {
    return null;
  }

  return (
    <section className="mb-6 grid gap-3 md:grid-cols-4">
      <Card title="Online Agents" value={summary.onlineAgents} hint="Live heartbeats in last window" tone="hover:border-emerald-500/40" />
      <Card title="Offline Agents" value={summary.offlineAgents} hint="Needs reconnect investigation" tone="hover:border-amber-500/40" />
      <Card title="Suspicious Queue" value={summary.suspiciousJobs} hint="Queued/dispatched jobs" tone="hover:border-blue-500/40" />
      <Card title="Failed Jobs" value={summary.failedJobs} hint="Potential detection signal" tone="hover:border-rose-500/40" />
    </section>
  );
}
