export interface AgentRecord {
  _id: string;
  agentId: string;
  hostname: string;
  ip: string;
  os: string;
  tags: string[];
  heartbeatAt: string;
  onlineUntil: string;
  createdAt: string;
  updatedAt: string;
  isOnline: boolean;
}

export interface JobRecord {
  _id: string;
  agentId: string;
  runAtIso: string;
  type: "http_check" | "msf_command";
  payload: { url?: string; command?: string };
  status: "scheduled" | "queued" | "dispatched" | "completed" | "failed";
  output: string | null;
  queuedAt: string | null;
  dispatchedAt: string | null;
  dispatchedTo: string | null;
  completedBy: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionData {
  username: string;
  expiresAt: string;
}

export interface MitigationSettings {
  rateLimitEnabled: boolean;
  requestsPerSecondPerIp: number;
  wafEnabled: boolean;
  idsMode: "IDS" | "IPS";
  autoBlockEnabled: boolean;
}

export interface EnforcementStats {
  rateLimitBlocked: number;
  wafBlocked: number;
  ipsBlocked: number;
  blockedIps: string[];
  wafLog: Array<{ ip: string; pattern: string; path: string; time: string }>;
  rateLimitLog: Array<{ ip: string; count: number; time: string }>;
}

export interface SecurityEvent {
  id: string;
  level: "low" | "medium" | "high";
  title: string;
  detail: string;
  createdAt: string;
}

export interface SecuritySummary {
  generatedAt: string;
  onlineAgents: number;
  offlineAgents: number;
  suspiciousJobs: number;
  failedJobs: number;
  mitigation: MitigationSettings;
  enforcement: EnforcementStats;
  events: SecurityEvent[];
}

export interface SnortAlert {
  id: string;
  timestamp: string;
  gid: number;
  sid: number;
  revision: number;
  message: string;
  classification: string;
  priority: number;
  protocol: string;
  srcIp: string;
  srcPort: number;
  dstIp: string;
  dstPort: number;
  raw: string;
}

export interface SnortStats {
  totalAlerts: number;
  byPriority: Record<number, number>;
  byClassification: Record<string, number>;
  topSrcIps: Array<{ label: string; count: number }>;
  topDstIps: Array<{ label: string; count: number }>;
  byProtocol: Record<string, number>;
  fileExists: boolean;
  lastRead: number;
}
