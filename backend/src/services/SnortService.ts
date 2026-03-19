import { Client } from "ssh2";
import type { SnortAlert, SnortStats } from "../types";

export class SnortService {
  private collectorUrl: string;
  private cachedAlerts: SnortAlert[] = [];
  private cachedStats: SnortStats | null = null;
  private lastFetch = 0;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  // SSH config
  private sshHost = "192.168.100.54";
  private sshUser = "cyberlab";
  private sshPass = "cyberlab";
  private sshAlertFile = "/var/log/snort/snort.alert.fast";
  private useSsh = true;

  constructor(snortCollectorUrl: string) {
    this.collectorUrl = snortCollectorUrl.replace(/\/+$/, "");
  }

  start(intervalMs: number = 3000): void {
    this.pollTimer = setInterval(() => void this.poll(), intervalMs);
    void this.poll();
  }

  stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async poll(): Promise<void> {
    if (this.useSsh) {
      return this.pollSsh();
    }

    try {
      const [alertsRes, statsRes] = await Promise.all([
        fetch(`${this.collectorUrl}/api/alerts?limit=300`, { signal: AbortSignal.timeout(5000) }),
        fetch(`${this.collectorUrl}/api/stats`, { signal: AbortSignal.timeout(5000) }),
      ]);

      if (alertsRes.ok) {
        this.cachedAlerts = (await alertsRes.json()) as SnortAlert[];
      }
      if (statsRes.ok) {
        this.cachedStats = (await statsRes.json()) as SnortStats;
      }
      this.lastFetch = Date.now();
    } catch {
      // collector unreachable — keep stale cache
    }
  }

  private async pollSsh(): Promise<void> {
    const conn = new Client();
    
    return new Promise((resolve) => {
      conn.on("ready", () => {
        conn.exec(`cat ${this.sshAlertFile}`, (err, stream) => {
          if (err) {
            conn.end();
            return resolve();
          }
          let buffer = "";
          stream.on("data", (data: Buffer) => {
            buffer += data.toString();
          });
          stream.on("close", () => {
            this.parseSshOutput(buffer);
            this.lastFetch = Date.now();
            conn.end();
            resolve();
          });
        });
      }).on("error", () => {
        resolve();
      }).connect({
        host: this.sshHost,
        port: 22,
        username: this.sshUser,
        password: this.sshPass,
        readyTimeout: 5000,
      });
    });
  }

  private parseSshOutput(output: string): void {
    const lines = output.split("\n").filter(l => l.trim().length > 0);
    const alerts: SnortAlert[] = [];
    
    // Parse Snort Fast-Alert format:
    // 03/17-10:20:30.123456  [**] [1:1000001:1] ALERT MESSAGE [**] [Classification: Misc Attack] [Priority: 1] {TCP} 1.2.3.4:123 -> 5.6.7.8:80
    
    const regex = /^(\d{2}\/\d{2}-\d{2}:\d{2}:\d{2}\.\d{6})\s+\[\*\*\]\s+\[(\d+):(\d+):(\d+)\]\s+(.*?)\s+\[\*\*\]\s+\[Classification:\s+(.*?)\]\s+\[Priority:\s+(\d+)\]\s+{(.*?)}\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d+))?\s+->\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d+))?/;

    lines.forEach((line, idx) => {
      const match = line.match(regex);
      if (match) {
        const [_, timestamp, gid, sid, rev, message, classification, priority, protocol, srcIp, srcPort, dstIp, dstPort] = match;
        alerts.push({
          id: `ssh-${idx}-${Date.now()}`,
          timestamp,
          gid: parseInt(gid),
          sid: parseInt(sid),
          revision: parseInt(rev),
          message,
          classification,
          priority: parseInt(priority),
          protocol,
          srcIp,
          srcPort: srcPort ? parseInt(srcPort) : 0,
          dstIp,
          dstPort: dstPort ? parseInt(dstPort) : 0,
          raw: line
        });
      }
    });

    // Most recent first
    this.cachedAlerts = alerts.reverse().slice(0, 500);
    this.updateStats();
  }

  private updateStats(): void {
    const alerts = this.cachedAlerts;
    const stats: SnortStats = {
      totalAlerts: alerts.length,
      byPriority: {},
      byClassification: {},
      topSrcIps: [],
      topDstIps: [],
      byProtocol: {},
      fileExists: true,
      lastRead: Date.now()
    };

    const srcIps: Record<string, number> = {};
    const dstIps: Record<string, number> = {};

    alerts.forEach(a => {
      stats.byPriority[a.priority] = (stats.byPriority[a.priority] || 0) + 1;
      stats.byClassification[a.classification] = (stats.byClassification[a.classification] || 0) + 1;
      stats.byProtocol[a.protocol] = (stats.byProtocol[a.protocol] || 0) + 1;
      srcIps[a.srcIp] = (srcIps[a.srcIp] || 0) + 1;
      dstIps[a.dstIp] = (dstIps[a.dstIp] || 0) + 1;
    });

    stats.topSrcIps = Object.entries(srcIps)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label, count]) => ({ label, count }));

    stats.topDstIps = Object.entries(dstIps)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label, count]) => ({ label, count }));

    this.cachedStats = stats;
  }

  async getHealth(): Promise<{ connected: boolean; collectorUrl: string; lastFetch: number; sshMode?: boolean }> {
    if (this.useSsh) {
      return { 
        connected: this.lastFetch > Date.now() - 15000, 
        collectorUrl: `ssh://${this.sshHost}`, 
        lastFetch: this.lastFetch,
        sshMode: true
      };
    }
    
    try {
      const res = await fetch(`${this.collectorUrl}/api/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = (await res.json()) as Record<string, unknown>;
        return {
          connected: true,
          collectorUrl: this.collectorUrl,
          lastFetch: this.lastFetch,
          ...data,
        };
      }
    } catch {
      // unreachable
    }
    return { connected: false, collectorUrl: this.collectorUrl, lastFetch: this.lastFetch };
  }

  getAlerts(): SnortAlert[] {
    return this.cachedAlerts;
  }

  getStats(): SnortStats | null {
    return this.cachedStats;
  }

  updateCollectorUrl(url: string): void {
    this.collectorUrl = url.replace(/\/+$/, "");
    this.useSsh = url.startsWith("ssh://");
    if (this.useSsh) {
      this.sshHost = url.replace("ssh://", "");
    }
  }
}
