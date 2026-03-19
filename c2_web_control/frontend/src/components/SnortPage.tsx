import React from "react";
import type { SnortAlert, SnortHealth, SnortStats } from "../types";

interface SnortPageProps {
  health: SnortHealth;
  alerts: SnortAlert[];
  stats: SnortStats | null;
}

const priorityStyle: Record<number, { bg: string; label: string }> = {
  1: { bg: "bg-rose-500/15 text-rose-300 border-rose-500/20", label: "Critical" },
  2: { bg: "bg-amber-500/15 text-amber-300 border-amber-500/20", label: "High" },
  3: { bg: "bg-sky-500/15 text-sky-300 border-sky-500/20", label: "Medium" },
  4: { bg: "bg-slate-500/15 text-slate-300 border-slate-500/20", label: "Low" },
};

function ConnectionStatus({ health }: { health: SnortHealth }) {
  return (
    <div className="glass-card panel-shell panel-inner-glow fade-in-up rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Snort IDS</p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            {health.connected ? "Collector Online" : "Collector Offline"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-2.5 w-2.5 rounded-full ${
              health.connected
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                : "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]"
            }`}
          />
          <span className={`text-sm ${health.connected ? "text-emerald-300" : "text-rose-300"}`}>
            {health.connected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="status-pill">Collector {health.collectorUrl || "N/A"}</span>
        {health.fileExists !== undefined && (
          <span className="status-pill">Alert file {health.fileExists ? "found" : "not found"}</span>
        )}
        {health.alertFile && <span className="status-pill">{health.alertFile}</span>}
      </div>
      {!health.connected && (
        <p className="mt-3 text-sm text-slate-400">
          Start collector on Snort VM:{" "}
          <code className="rounded bg-slate-800/80 px-2 py-0.5 text-xs text-emerald-300">
            python3 snort-collector.py --alert-file /var/log/snort/snort.alert.fast
          </code>
        </p>
      )}
    </div>
  );
}

function StatsCards({ stats }: { stats: SnortStats | null }) {
  if (!stats) return null;

  const p1 = stats.byPriority[1] || 0;
  const p2 = stats.byPriority[2] || 0;
  const p3 = stats.byPriority[3] || 0;

  return (
    <section className="grid gap-3 md:grid-cols-4">
      <div className="glass-card panel-shell fade-in-up rounded-3xl p-5 hover:border-emerald-500/40">
        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Total Alerts</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{stats.totalAlerts}</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">All captured alerts</p>
      </div>
      <div className="glass-card panel-shell fade-in-up rounded-3xl p-5 hover:border-rose-500/40">
        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Priority 1</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-rose-300">{p1}</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">Critical severity</p>
      </div>
      <div className="glass-card panel-shell fade-in-up rounded-3xl p-5 hover:border-amber-500/40">
        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Priority 2</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-amber-300">{p2}</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">High severity</p>
      </div>
      <div className="glass-card panel-shell fade-in-up rounded-3xl p-5 hover:border-sky-500/40">
        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Priority 3</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-sky-300">{p3}</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">Medium severity</p>
      </div>
    </section>
  );
}

function TopIps({ stats }: { stats: SnortStats | null }) {
  if (!stats) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="glass-card panel-shell panel-inner-glow fade-in-up rounded-3xl p-5">
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Top Source IPs</p>
        <h2 className="mt-1 mb-4 text-xl font-semibold text-white">Attackers</h2>
        {stats.topSrcIps.length === 0 ? (
          <p className="text-sm text-slate-500">No data yet</p>
        ) : (
          <div className="space-y-2">
            {stats.topSrcIps.slice(0, 8).map((item) => (
              <div className="flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-slate-800/40" key={item.label}>
                <span className="font-mono text-sm text-slate-200">{item.label}</span>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-rose-500/60"
                      style={{ width: `${Math.min(100, (item.count / (stats.topSrcIps[0]?.count || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="min-w-[3ch] text-right text-sm font-medium text-rose-300">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card panel-shell panel-inner-glow fade-in-up rounded-3xl p-5">
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Top Destination IPs</p>
        <h2 className="mt-1 mb-4 text-xl font-semibold text-white">Targets</h2>
        {stats.topDstIps.length === 0 ? (
          <p className="text-sm text-slate-500">No data yet</p>
        ) : (
          <div className="space-y-2">
            {stats.topDstIps.slice(0, 8).map((item) => (
              <div className="flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-slate-800/40" key={item.label}>
                <span className="font-mono text-sm text-slate-200">{item.label}</span>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-amber-500/60"
                      style={{ width: `${Math.min(100, (item.count / (stats.topDstIps[0]?.count || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="min-w-[3ch] text-right text-sm font-medium text-amber-300">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProtocolBreakdown({ stats }: { stats: SnortStats | null }) {
  if (!stats || Object.keys(stats.byProtocol).length === 0) return null;

  const total = Object.values(stats.byProtocol).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(stats.byProtocol).sort((a, b) => b[1] - a[1]);

  const colors: Record<string, string> = {
    TCP: "bg-sky-500",
    UDP: "bg-purple-500",
    ICMP: "bg-amber-500",
  };

  return (
    <div className="glass-card panel-shell panel-inner-glow fade-in-up rounded-3xl p-5">
      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Protocols</p>
      <h2 className="mt-1 mb-4 text-xl font-semibold text-white">Traffic Breakdown</h2>
      <div className="mb-3 flex h-3 overflow-hidden rounded-full bg-slate-800">
        {sorted.map(([proto, count]) => (
          <div
            className={`${colors[proto] || "bg-emerald-500"} transition-all duration-500`}
            key={proto}
            style={{ width: `${(count / total) * 100}%` }}
            title={`${proto}: ${count}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        {sorted.map(([proto, count]) => (
          <div className="flex items-center gap-2" key={proto}>
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors[proto] || "bg-emerald-500"}`} />
            <span className="text-sm text-slate-300">
              {proto} <span className="text-slate-500">{count} ({((count / total) * 100).toFixed(1)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClassificationBreakdown({ stats }: { stats: SnortStats | null }) {
  if (!stats || Object.keys(stats.byClassification).length === 0) return null;

  const sorted = Object.entries(stats.byClassification).sort((a, b) => b[1] - a[1]);

  return (
    <div className="glass-card panel-shell panel-inner-glow fade-in-up rounded-3xl p-5">
      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Classifications</p>
      <h2 className="mt-1 mb-4 text-xl font-semibold text-white">Alert Categories</h2>
      <div className="space-y-2">
        {sorted.slice(0, 10).map(([cls, count]) => (
          <div className="flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-slate-800/40" key={cls}>
            <span className="text-sm text-slate-200">{cls}</span>
            <span className="rounded-full bg-slate-800 px-3 py-0.5 text-xs font-medium text-slate-300">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertFeed({ alerts }: { alerts: SnortAlert[] }) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [filterPriority, setFilterPriority] = React.useState<number | "all">("all");
  const itemsPerPage = 10;

  const filteredAlerts = React.useMemo(() => {
    if (filterPriority === "all") return alerts;
    return alerts.filter(a => a.priority === filterPriority);
  }, [alerts, filterPriority]);

  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
  const paginatedAlerts = filteredAlerts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterPriority]);

  return (
    <div className="glass-card panel-shell panel-inner-glow fade-in-up rounded-3xl p-5">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Live Feed</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Security Alerts</h2>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {(["all", 1, 2, 3, 4] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterPriority === p 
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                  : "bg-slate-800/40 text-slate-400 border border-transparent hover:bg-slate-800/60"
              }`}
            >
              {p === "all" ? "All Alerts" : priorityStyle[p].label}
            </button>
          ))}
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">No alerts match the selected priority.</p>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedAlerts.map((alert) => {
              const style = priorityStyle[alert.priority] || priorityStyle[3];
              return (
                <div
                  className={`rounded-2xl border px-4 py-3 transition-all duration-300 ${style.bg}`}
                  key={alert.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 text-[10px] uppercase tracking-[0.18em]">{style.label}</span>
                        <span className="shrink-0 rounded-full bg-black/20 px-2 py-0.5 text-[10px] text-slate-400">
                          SID:{alert.sid}
                        </span>
                        <span className="shrink-0 rounded-full bg-black/20 px-2 py-0.5 text-[10px] text-slate-400">
                          {alert.protocol}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium">{alert.message}</p>
                      <p className="mt-1 text-xs opacity-70">{alert.classification}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-slate-400 font-mono">
                      {alert.timestamp}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 font-mono text-xs opacity-80">
                    <span className="text-slate-200">{alert.srcIp}{alert.srcPort ? `:${alert.srcPort}` : ""}</span>
                    <span className="text-slate-500">&rarr;</span>
                    <span className="text-slate-200">{alert.dstIp}{alert.dstPort ? `:${alert.dstPort}` : ""}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-2 rounded-xl bg-slate-800/40 text-slate-400 disabled:opacity-30 hover:bg-slate-800/60 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-medium text-slate-400">
                Page <span className="text-white">{currentPage}</span> of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl bg-slate-800/40 text-slate-400 disabled:opacity-30 hover:bg-slate-800/60 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function SnortPage({ health, alerts, stats }: SnortPageProps) {
  return (
    <div className="space-y-6">
      <ConnectionStatus health={health} />
      <StatsCards stats={stats} />

      <section className="grid gap-4 lg:grid-cols-2">
        <ProtocolBreakdown stats={stats} />
        <ClassificationBreakdown stats={stats} />
      </section>

      <TopIps stats={stats} />
      <AlertFeed alerts={alerts} />
    </div>
  );
}
