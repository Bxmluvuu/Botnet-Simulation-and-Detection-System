import { useCallback, useEffect, useState } from "react";
import type { ApiClient } from "../services/apiClient";
import type { SnortAlert, SnortHealth, SnortStats } from "../types";

export function useSnortData(api: ApiClient, isAuthenticated: boolean) {
  const [health, setHealth] = useState<SnortHealth>({ connected: false, collectorUrl: "", lastFetch: 0 });
  const [alerts, setAlerts] = useState<SnortAlert[]>([]);
  const [stats, setStats] = useState<SnortStats | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await api.request("/api/snort/health");
      if (res.ok) setHealth((await res.json()) as SnortHealth);
    } catch { /* ignore */ }
  }, [api]);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await api.request("/api/snort/alerts");
      if (res.ok) setAlerts((await res.json()) as SnortAlert[]);
    } catch { /* ignore */ }
  }, [api]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.request("/api/snort/stats");
      if (res.ok) setStats((await res.json()) as SnortStats);
    } catch { /* ignore */ }
  }, [api]);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchHealth(), fetchAlerts(), fetchStats()]);
  }, [fetchHealth, fetchAlerts, fetchStats]);

  useEffect(() => {
    if (!isAuthenticated) return;

    void fetchAll();
    const timer = setInterval(() => void fetchAll(), 4000);
    return () => clearInterval(timer);
  }, [isAuthenticated, fetchAll]);

  return { health, alerts, stats };
}
