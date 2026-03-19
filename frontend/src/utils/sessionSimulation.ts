import type { Agent, Job, SecuritySummary } from "../types";

export interface SessionView {
  id: string;
  agentId: string;
  hostname: string;
  ip: string;
  os: string;
  user: string;
  privilege: "User" | "Elevated";
  transport: string;
  latencyMs: number;
  isOnline: boolean;
  heartbeatAt: string;
  lastAction: string;
  risk: "low" | "medium" | "high";
}

export interface SessionTimelineEvent {
  id: string;
  phase: "detect" | "prevent" | "result";
  title: string;
  detail: string;
  createdAt: string;
  tone: "sky" | "amber" | "rose" | "emerald";
}

function buildUser(hostname: string, os: string): string {
  if (os.toLowerCase().includes("windows")) {
    return `${hostname}\\student`;
  }
  return `${hostname.toLowerCase()}:lab`;
}

function buildLatency(agentId: string): number {
  return agentId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 120 + 18;
}

function buildPrivilege(agent: Agent): "User" | "Elevated" {
  if (agent.tags.includes("admin") || agent.tags.includes("elevated")) {
    return "Elevated";
  }
  return "User";
}

function getLatestJob(agentId: string, jobs: Job[]): Job | undefined {
  return jobs.find((job) => job.agentId === agentId || job.agentId === "all");
}

function buildLastAction(agentId: string, jobs: Job[]): string {
  const latestJob = getLatestJob(agentId, jobs);
  if (!latestJob) {
    return "Heartbeat only";
  }

  if (latestJob.status === "completed") {
    return "Validation completed";
  }

  if (latestJob.status === "failed") {
    return "Validation failed";
  }

  return `Job ${latestJob.status}`;
}

function buildRisk(agent: Agent, jobs: Job[]): "low" | "medium" | "high" {
  const latestJob = getLatestJob(agent.agentId, jobs);
  if (!agent.isOnline) {
    return "high";
  }
  if (latestJob?.status === "failed") {
    return "high";
  }
  if (latestJob && latestJob.status !== "completed") {
    return "medium";
  }
  return "low";
}

function buildDetectEvent(session: SessionView, jobs: Job[]): SessionTimelineEvent {
  const latestJob = getLatestJob(session.agentId, jobs);

  if (!session.isOnline) {
    return {
      id: `${session.id}-detect`,
      phase: "detect",
      title: "Heartbeat drift detected",
      detail: `Session ${session.id} missed its expected heartbeat window and is now marked stale.`,
      createdAt: session.heartbeatAt,
      tone: "rose",
    };
  }

  if (!latestJob) {
    return {
      id: `${session.id}-detect`,
      phase: "detect",
      title: "Baseline telemetry normal",
      detail: `No active validation job for ${session.agentId}; session remains in observation mode.`,
      createdAt: session.heartbeatAt,
      tone: "sky",
    };
  }

  if (latestJob.status === "failed") {
    return {
      id: `${session.id}-detect`,
      phase: "detect",
      title: "Execution anomaly detected",
      detail: `Latest ${latestJob.type} validation returned a failed result for ${session.ip}.`,
      createdAt: latestJob.runAtIso,
      tone: "rose",
    };
  }

  return {
    id: `${session.id}-detect`,
    phase: "detect",
    title: "Scheduled activity observed",
    detail: `Agent ${session.agentId} picked up a ${latestJob.type} job and remained within the expected telemetry envelope.`,
    createdAt: latestJob.runAtIso,
    tone: latestJob.status === "completed" ? "sky" : "amber",
  };
}

function buildPreventEvent(session: SessionView, summary: SecuritySummary | null): SessionTimelineEvent {
  const mitigation = summary?.mitigation;
  const controls = [
    mitigation?.rateLimitEnabled ? `Rate limit ${mitigation.requestsPerSecondPerIp}/s` : "Rate limit standby",
    mitigation?.wafEnabled ? "WAF simulation enabled" : "WAF simulation off",
    mitigation?.idsMode ? `${mitigation.idsMode} posture active` : "IDS posture pending",
    mitigation?.autoBlockEnabled ? "Auto-block armed" : "Manual response only",
  ];

  const defensiveState = mitigation?.autoBlockEnabled || mitigation?.idsMode === "IPS" ? "amber" : "sky";

  return {
    id: `${session.id}-prevent`,
    phase: "prevent",
    title: "Mitigation policy evaluated",
    detail: `${controls.join(" | ")} for ${session.hostname}.`,
    createdAt: summary?.generatedAt || session.heartbeatAt,
    tone: defensiveState,
  };
}

function buildResultEvent(session: SessionView, jobs: Job[]): SessionTimelineEvent {
  const latestJob = getLatestJob(session.agentId, jobs);

  if (!session.isOnline) {
    return {
      id: `${session.id}-result`,
      phase: "result",
      title: "Session isolated pending recovery",
      detail: `Control plane kept ${session.agentId} visible in the inventory while awaiting reconnect.`,
      createdAt: session.heartbeatAt,
      tone: "amber",
    };
  }

  if (!latestJob) {
    return {
      id: `${session.id}-result`,
      phase: "result",
      title: "Session remained stable",
      detail: `${session.agentId} stayed connected with no queued intervention required.`,
      createdAt: session.heartbeatAt,
      tone: "emerald",
    };
  }

  if (latestJob.status === "completed") {
    return {
      id: `${session.id}-result`,
      phase: "result",
      title: "Validation completed cleanly",
      detail: `The latest control action finished successfully and the session returned to a steady state.`,
      createdAt: latestJob.runAtIso,
      tone: "emerald",
    };
  }

  if (latestJob.status === "failed") {
    return {
      id: `${session.id}-result`,
      phase: "result",
      title: "Escalate for analyst review",
      detail: `Failed validation suggests the analyst should inspect host posture and network telemetry.`,
      createdAt: latestJob.runAtIso,
      tone: "rose",
    };
  }

  return {
    id: `${session.id}-result`,
    phase: "result",
    title: "Action still in progress",
    detail: `Latest job status is ${latestJob.status}; keep monitoring until a terminal result is recorded.`,
    createdAt: latestJob.runAtIso,
    tone: "amber",
  };
}

export function buildSessions(agents: Agent[], jobs: Job[]): SessionView[] {
  return agents.map((agent, index) => ({
    id: `session-${index + 1}`,
    agentId: agent.agentId,
    hostname: agent.hostname,
    ip: agent.ip,
    os: agent.os,
    user: buildUser(agent.hostname, agent.os),
    privilege: buildPrivilege(agent),
    transport: "agent-heartbeat",
    latencyMs: buildLatency(agent.agentId),
    isOnline: agent.isOnline,
    heartbeatAt: agent.heartbeatAt,
    lastAction: buildLastAction(agent.agentId, jobs),
    risk: buildRisk(agent, jobs),
  }));
}

export function buildSessionTimeline(
  session: SessionView,
  jobs: Job[],
  summary: SecuritySummary | null
): SessionTimelineEvent[] {
  return [buildDetectEvent(session, jobs), buildPreventEvent(session, summary), buildResultEvent(session, jobs)];
}
