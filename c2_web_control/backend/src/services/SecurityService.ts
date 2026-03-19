import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  AgentRecord,
  JobRecord,
  MitigationSettings,
  EnforcementStats,
  SecurityEvent,
  SecuritySummary,
  SnortAlert,
} from "../types";
import { TimeUtil } from "../utils/time";

export class SecurityService {
  private mitigation: MitigationSettings = {
    rateLimitEnabled: true,
    requestsPerSecondPerIp: 5,
    wafEnabled: false,
    idsMode: "IDS",
    autoBlockEnabled: false,
  };

  private cachedEnforcement: EnforcementStats = {
    rateLimitBlocked: 0,
    wafBlocked: 0,
    ipsBlocked: 0,
    blockedIps: [],
    wafLog: [],
    rateLimitLog: [],
  };

  private targetProxyUrl: string;

  constructor(targetProxyUrl: string) {
    this.targetProxyUrl = targetProxyUrl.replace(/\/+$/, "");
  }

  getMitigation(): MitigationSettings {
    return { ...this.mitigation };
  }

  getEnforcement(): EnforcementStats {
    return { ...this.cachedEnforcement };
  }

  async updateMitigation(next: Partial<MitigationSettings>): Promise<MitigationSettings> {
    this.mitigation = {
      ...this.mitigation,
      ...next,
      requestsPerSecondPerIp: Math.max(1, Math.min(100, Number(next.requestsPerSecondPerIp ?? this.mitigation.requestsPerSecondPerIp))),
      idsMode: next.idsMode === "IPS" ? "IPS" : next.idsMode === "IDS" ? "IDS" : this.mitigation.idsMode,
    };

    await this.pushConfigToProxy();
    return { ...this.mitigation };
  }

  async unblockIp(ip: string): Promise<boolean> {
    try {
      await fetch(`${this.targetProxyUrl}/api/unblock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip }),
        signal: AbortSignal.timeout(3000),
      });
      await this.pullStateFromProxy();
      return true;
    } catch {
      return false;
    }
  }

  async clearAllBlocks(): Promise<void> {
    try {
      await fetch(`${this.targetProxyUrl}/api/unblock-all`, {
        method: "POST",
        signal: AbortSignal.timeout(3000),
      });
      await this.pullStateFromProxy();
    } catch {
      // best-effort
    }
  }

  async syncSnortAlerts(alerts: SnortAlert[]): Promise<void> {
    if (!this.mitigation.autoBlockEnabled) return;

    const ipsToBlock: string[] = [];
    for (const alert of alerts) {
      if (alert.priority <= 2 && alert.srcIp) {
        ipsToBlock.push(alert.srcIp);
      }
    }

    if (ipsToBlock.length === 0) return;

    try {
      await fetch(`${this.targetProxyUrl}/api/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedIps: ipsToBlock }),
        signal: AbortSignal.timeout(3000),
      });
    } catch {
      // best-effort
    }
  }

  private async pushConfigToProxy(): Promise<void> {
    try {
      const res = await fetch(`${this.targetProxyUrl}/api/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.mitigation),
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const state = (await res.json()) as Record<string, unknown>;
        this.updateCachedEnforcement(state);
      }
    } catch {
      // proxy unreachable
    }
  }

  async pullStateFromProxy(): Promise<void> {
    try {
      const res = await fetch(`${this.targetProxyUrl}/api/state`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const state = (await res.json()) as Record<string, unknown>;
        this.updateCachedEnforcement(state);
      }
    } catch {
      // proxy unreachable
    }
  }

  private updateCachedEnforcement(state: Record<string, unknown>): void {
    const stats = (state.stats || {}) as Record<string, unknown>;
    const blockedIps = (state.blockedIps || []) as string[];
    this.cachedEnforcement = {
      rateLimitBlocked: Number(stats.rateLimitBlocked || 0),
      wafBlocked: Number(stats.wafBlocked || 0),
      ipsBlocked: Number(stats.ipsBlocked || 0),
      blockedIps,
      wafLog: (stats.wafLog || []) as EnforcementStats["wafLog"],
      rateLimitLog: (stats.rateLimitLog || []) as EnforcementStats["rateLimitLog"],
    };
  }

  startPolling(intervalMs: number = 3000): void {
    setInterval(() => void this.pullStateFromProxy(), intervalMs);
    void this.pullStateFromProxy();
    void this.pushConfigToProxy();
  }

  async getProxyHealth(): Promise<{ connected: boolean; url: string }> {
    try {
      const res = await fetch(`${this.targetProxyUrl}/api/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) return { connected: true, url: this.targetProxyUrl };
    } catch { /* unreachable */ }
    return { connected: false, url: this.targetProxyUrl };
  }

  buildSummary(agents: AgentRecord[], jobs: JobRecord[]): SecuritySummary {
    const onlineAgents = agents.filter((a) => a.isOnline).length;
    const offlineAgents = Math.max(agents.length - onlineAgents, 0);
    const failedJobs = jobs.filter((j) => j.status === "failed").length;
    const suspiciousJobs = jobs.filter((j) => j.status === "queued" || j.status === "dispatched").length;

    const events: SecurityEvent[] = [];
    const now = TimeUtil.nowIso();
    const ef = this.cachedEnforcement;

    if (ef.wafBlocked > 0) {
      const recent = ef.wafLog.slice(-1)[0];
      events.push({
        id: `waf-${ef.wafBlocked}`,
        level: "high",
        title: `WAF blocked ${ef.wafBlocked} request(s) on target`,
        detail: recent ? `Last: ${recent.pattern} from ${recent.ip} → ${recent.path}` : "Malicious patterns detected",
        createdAt: now,
      });
    }

    if (ef.rateLimitBlocked > 0) {
      events.push({
        id: `ratelimit-${ef.rateLimitBlocked}`,
        level: "medium",
        title: `Rate limit triggered ${ef.rateLimitBlocked} time(s) on target`,
        detail: `Limit: ${this.mitigation.requestsPerSecondPerIp} req/s/IP`,
        createdAt: now,
      });
    }

    if (ef.blockedIps.length > 0) {
      events.push({
        id: `blocked-${ef.blockedIps.length}`,
        level: "high",
        title: `${ef.blockedIps.length} IP(s) auto-blocked on target`,
        detail: `IPs: ${ef.blockedIps.slice(0, 5).join(", ")}${ef.blockedIps.length > 5 ? "..." : ""}`,
        createdAt: now,
      });
    }

    if (offlineAgents > 0) {
      events.push({ id: `offline-${offlineAgents}`, level: "medium", title: "Agent heartbeat missing", detail: `${offlineAgents} agent(s) currently offline`, createdAt: now });
    }
    if (failedJobs > 0) {
      events.push({ id: `failed-${failedJobs}`, level: "high", title: "Failed validation jobs", detail: `${failedJobs} job(s) failed in recent history`, createdAt: now });
    }
    if (suspiciousJobs > 0) {
      events.push({ id: `queued-${suspiciousJobs}`, level: "low", title: "Pending execution queue", detail: `${suspiciousJobs} job(s) currently queued/dispatched`, createdAt: now });
    }

    if (events.length === 0) {
      events.push({ id: "stable", level: "low", title: "No active anomalies", detail: "All controls nominal — no threats detected", createdAt: now });
    }

    return {
      generatedAt: now,
      onlineAgents,
      offlineAgents,
      suspiciousJobs,
      failedJobs,
      mitigation: { ...this.mitigation },
      enforcement: { ...ef },
      events,
    };
  }
}
