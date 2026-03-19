import { useEffect, useState } from "react";
import type { ApiClient } from "../services/apiClient";
import type { MitigationSettings, SecuritySummary } from "../types";

interface PreventPanelProps {
  api: ApiClient;
  summary: SecuritySummary | null;
  onUpdate: (next: Partial<MitigationSettings>) => Promise<boolean>;
  onUnblockIp?: (ip: string) => Promise<void>;
  onUnblockAll?: () => Promise<void>;
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => Promise<void> | void }) {
  return (
    <button aria-pressed={checked} className="toggle" data-on={checked} onClick={() => void onChange(!checked)} type="button" />
  );
}

export function PreventPanel({ api, summary, onUpdate, onUnblockIp, onUnblockAll }: PreventPanelProps) {
  const mitigation = summary?.mitigation;
  const enforcement = summary?.enforcement;
  const [proxyConnected, setProxyConnected] = useState(false);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const response = await api.request("/api/security/proxy-health");
        if (!response.ok) {
          if (alive) setProxyConnected(false);
          return;
        }

        const res = (await response.json()) as { connected?: boolean };
        if (alive) setProxyConnected(res.connected ?? false);
      } catch {
        if (alive) setProxyConnected(false);
      }
    };
    void check();
    const iv = setInterval(() => void check(), 5000);
    return () => { alive = false; clearInterval(iv); };
  }, [api]);

  const toggle = async (field: keyof MitigationSettings, value: boolean | number | "IDS" | "IPS") => {
    await onUpdate({ [field]: value } as Partial<MitigationSettings>);
  };

  return (
    <section className="glass-card panel-shell panel-inner-glow fade-in-up rounded-3xl p-5 transition-all duration-500 hover:-translate-y-1">
      <div className="relative mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Prevention</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Target Protection Proxy</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-block h-2 w-2 rounded-full ${proxyConnected ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" : "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]"}`} />
          <span className="text-[10px] text-slate-400">{proxyConnected ? "Connected to .53" : "Proxy offline"}</span>
          <span className="status-pill">{mitigation?.idsMode || "..."}</span>
        </div>
      </div>

      {!mitigation && <p className="text-sm text-slate-400">Loading mitigation controls...</p>}

      {mitigation && (
        <div className="relative space-y-3 text-sm">
          {enforcement && (enforcement.rateLimitBlocked > 0 || enforcement.wafBlocked > 0 || enforcement.ipsBlocked > 0) && (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-center">
                <p className="text-lg font-semibold text-amber-300">{enforcement.rateLimitBlocked}</p>
                <p className="text-[10px] uppercase tracking-wide text-amber-400/70">Rate blocked</p>
              </div>
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-center">
                <p className="text-lg font-semibold text-rose-300">{enforcement.wafBlocked}</p>
                <p className="text-[10px] uppercase tracking-wide text-rose-400/70">WAF blocked</p>
              </div>
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 px-3 py-2 text-center">
                <p className="text-lg font-semibold text-purple-300">{enforcement.ipsBlocked}</p>
                <p className="text-[10px] uppercase tracking-wide text-purple-400/70">IPS blocked</p>
              </div>
            </div>
          )}

          <label className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/45 p-3 transition hover:border-slate-600 hover:bg-slate-900/80">
            <div>
              <span>Rate limiting</span>
              <p className="text-[10px] text-slate-500">Block IPs exceeding request threshold</p>
            </div>
            <ToggleSwitch checked={mitigation.rateLimitEnabled} onChange={(v) => toggle("rateLimitEnabled", v)} />
          </label>

          <label className="block rounded-2xl border border-slate-800/80 bg-slate-950/45 p-3 transition hover:border-slate-600 hover:bg-slate-900/80">
            <div className="mb-2 flex items-center justify-between">
              <span>Requests/sec/IP</span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-emerald-300">{mitigation.requestsPerSecondPerIp}</span>
            </div>
            <input
              className="slider"
              max={30}
              min={1}
              onChange={(e) => void toggle("requestsPerSecondPerIp", Number(e.target.value))}
              type="range"
              value={mitigation.requestsPerSecondPerIp}
            />
          </label>

          <label className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/45 p-3 transition hover:border-slate-600 hover:bg-slate-900/80">
            <div>
              <span>WAF — Web Application Firewall</span>
              <p className="text-[10px] text-slate-500">Block SQLi, XSS, path traversal, command injection</p>
            </div>
            <ToggleSwitch checked={mitigation.wafEnabled} onChange={(v) => toggle("wafEnabled", v)} />
          </label>

          <label className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/45 p-3 transition hover:border-slate-600 hover:bg-slate-900/80">
            <div>
              <span>IDS / IPS mode</span>
              <p className="text-[10px] text-slate-500">
                {mitigation.idsMode === "IDS" ? "Detect only — log but allow traffic" : "Active prevention — block malicious traffic"}
              </p>
            </div>
            <select
              className="control-select max-w-[8rem] py-2 text-xs"
              onChange={(e) => void toggle("idsMode", e.target.value as "IDS" | "IPS")}
              value={mitigation.idsMode}
            >
              <option value="IDS">IDS (log)</option>
              <option value="IPS">IPS (block)</option>
            </select>
          </label>

          <label className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/45 p-3 transition hover:border-slate-600 hover:bg-slate-900/80">
            <div>
              <span>Auto-block from Snort</span>
              <p className="text-[10px] text-slate-500">Block IPs with Snort priority 1-2 alerts</p>
            </div>
            <ToggleSwitch checked={mitigation.autoBlockEnabled} onChange={(v) => toggle("autoBlockEnabled", v)} />
          </label>

          {enforcement && enforcement.blockedIps.length > 0 && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-rose-300">Blocked IPs ({enforcement.blockedIps.length})</span>
                {onUnblockAll && (
                  <button
                    className="rounded-lg bg-slate-800 px-2 py-1 text-[10px] text-slate-300 transition hover:bg-slate-700"
                    onClick={() => void onUnblockAll()}
                    type="button"
                  >
                    Unblock all
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {enforcement.blockedIps.map((ip) => (
                  <span
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-rose-500/15 px-2 py-0.5 font-mono text-[11px] text-rose-300 transition hover:bg-rose-500/30"
                    key={ip}
                    onClick={() => onUnblockIp && void onUnblockIp(ip)}
                    title="Click to unblock"
                  >
                    {ip} &times;
                  </span>
                ))}
              </div>
            </div>
          )}

          {enforcement && enforcement.wafLog.length > 0 && (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/45 p-3">
              <p className="mb-2 text-xs font-medium text-slate-400">Recent WAF events</p>
              <div className="max-h-28 space-y-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
                {enforcement.wafLog.slice(-10).reverse().map((entry, i) => (
                  <div className="flex items-center justify-between rounded-lg bg-slate-900/60 px-2 py-1 text-[10px]" key={i}>
                    <span className="font-mono text-rose-300">{entry.ip}</span>
                    <span className="text-slate-400">{entry.pattern}</span>
                    <span className="text-slate-500">{entry.time.slice(11, 19)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
