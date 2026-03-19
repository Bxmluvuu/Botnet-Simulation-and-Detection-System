import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiClient } from "../services/apiClient";

export interface MsfStatus {
  connected: boolean;
  rpcUrl: string;
  version?: string;
}

export interface MsfSession {
  id: string;
  type: string;
  tunnel_local: string;
  tunnel_peer: string;
  via_exploit: string;
  via_payload: string;
  desc: string;
  info: string;
  session_host: string;
  session_port: number;
  username: string;
  platform: string;
  arch: string;
}

export interface MsfConsoleOutput {
  data: string;
  prompt: string;
  busy: boolean;
}

export function useMetasploit(api: ApiClient, isAuthenticated: boolean) {
  const [status, setStatus] = useState<MsfStatus>({ connected: false, rpcUrl: "" });
  const [sessions, setSessions] = useState<MsfSession[]>([]);
  const [consoleId, setConsoleId] = useState<string | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string>("");
  const [consolePrompt, setConsolePrompt] = useState<string>("msf6 > ");
  const [consoleBusy, setConsoleBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.request("/api/msf/status");
      if (res.ok) {
        const data = (await res.json()) as MsfStatus;
        setStatus(data);
      }
    } catch {
      /* ignore */
    }
  }, [api]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.request("/api/msf/sessions");
      if (!res.ok) return;
      const data = (await res.json()) as Record<string, MsfSession>;
      const list = Object.entries(data).map(([id, s]) => ({ ...s, id }));
      setSessions(list);
    } catch {
      /* ignore */
    }
  }, [api]);

  const connect = useCallback(
    async (host: string, port: number, username: string, password: string, ssl: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.request("/api/msf/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ host, port, username, password, ssl }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string; version?: string };
        if (!res.ok) {
          setError(data.error || "Connection failed");
          return false;
        }
        await fetchStatus();
        return true;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Connection failed");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [api, fetchStatus]
  );

  const disconnect = useCallback(async () => {
    setLoading(true);
    try {
      await api.request("/api/msf/disconnect", { method: "POST" });
      setStatus({ connected: false, rpcUrl: "" });
      setSessions([]);
      setConsoleId(null);
      setConsoleOutput("");
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [api]);

  const createConsole = useCallback(async () => {
    try {
      const res = await api.request("/api/msf/console/create", { method: "POST" });
      if (!res.ok) return;
      const data = (await res.json()) as { id: string; prompt: string; busy: boolean };
      setConsoleId(data.id);
      setConsolePrompt(data.prompt);
      setConsoleOutput("");
      setConsoleBusy(data.busy);
    } catch {
      /* ignore */
    }
  }, [api]);

  const destroyConsole = useCallback(async () => {
    if (!consoleId) return;
    try {
      await api.request("/api/msf/console/destroy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consoleId }),
      });
    } catch {
      /* ignore */
    }
    setConsoleId(null);
    setConsoleOutput("");
    setConsoleBusy(false);
  }, [api, consoleId]);

  const writeConsole = useCallback(
    async (command: string) => {
      if (!consoleId) return;
      setConsoleOutput((prev) => prev + consolePrompt + command + "\n");
      try {
        await api.request("/api/msf/console/write", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consoleId, command }),
        });
        setConsoleBusy(true);
      } catch {
        /* ignore */
      }
    },
    [api, consoleId, consolePrompt]
  );

  const readConsole = useCallback(async () => {
    if (!consoleId) return;
    try {
      const res = await api.request("/api/msf/console/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consoleId }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as MsfConsoleOutput;
      if (data.data) {
        setConsoleOutput((prev) => prev + data.data);
      }
      setConsolePrompt(data.prompt);
      setConsoleBusy(data.busy);
    } catch {
      /* ignore */
    }
  }, [api, consoleId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchStatus();
  }, [isAuthenticated, fetchStatus]);

  useEffect(() => {
    if (!status.connected) return;

    void fetchSessions();
    const timer = setInterval(() => {
      void fetchSessions();
    }, 5000);

    return () => clearInterval(timer);
  }, [status.connected, fetchSessions]);

  useEffect(() => {
    if (!consoleId) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    pollRef.current = setInterval(() => {
      void readConsole();
    }, 1000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [consoleId, readConsole]);

  return {
    status,
    sessions,
    consoleId,
    consoleOutput,
    consolePrompt,
    consoleBusy,
    loading,
    error,
    connect,
    disconnect,
    createConsole,
    destroyConsole,
    writeConsole,
    fetchSessions,
  };
}
