import { useEffect, useMemo, useState } from "react";
import type { Agent, Job, SecuritySummary } from "../types";
import { fmtDate } from "../utils/format";
import { buildSessions } from "../utils/sessionSimulation";
import { MsfSession, useMetasploit } from "../hooks/useMetasploit";
import { ApiClient } from "../services/apiClient";

interface SessionsPageProps {
  agents: Agent[];
  jobs: Job[];
  summary: SecuritySummary | null;
  api: ApiClient;
  isAuthenticated: boolean;
}

const riskStyle: Record<string, string> = {
  low: "bg-sky-500/15 text-sky-300 border-sky-500/20",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  high: "bg-rose-500/15 text-rose-300 border-rose-500/20",
  critical: "bg-rose-600/20 text-rose-400 border-rose-600/30",
};

export function SessionsPage({ agents, jobs, summary, api, isAuthenticated }: SessionsPageProps) {
  const msf = useMetasploit(api, isAuthenticated);
  const [query, setQuery] = useState("");
  const [selectedMsfSessionId, setSelectedMsfSessionId] = useState<string | null>(null);
  const [interactCommand, setInteractCommand] = useState("");
  const [interactOutput, setInteractOutput] = useState<Record<string, string>>({});

  const simSessions = useMemo(() => buildSessions(agents, jobs), [agents, jobs]);
  
  const allSessions = useMemo(() => {
    return msf.sessions.map(s => ({
      id: `msf-${s.id}`,
      msfId: s.id,
      agentId: s.id,
      hostname: s.session_host,
      ip: s.session_host,
      os: s.platform,
      user: s.username || "unknown",
      isOnline: true,
      risk: "high",
      type: "metasploit",
      info: s.info,
      tunnel: s.tunnel_peer,
      arch: s.arch
    }));
  }, [msf.sessions]);

  const filteredSessions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allSessions.filter((s) => 
      !q || [s.id, s.hostname, s.ip, s.os, s.user].join(" ").toLowerCase().includes(q)
    );
  }, [allSessions, query]);

  const selectedSession = filteredSessions.find(s => s.id === (selectedMsfSessionId || filteredSessions[0]?.id));

  const handleInteract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession || selectedSession.type !== "metasploit" || !interactCommand) return;
    
    const sid = selectedSession.msfId;
    try {
      const res = await api.request("/api/msf/session/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: parseInt(sid!), command: interactCommand })
      });
      const data = await res.json();
      setInteractOutput(prev => ({
        ...prev,
        [selectedSession.id]: (prev[selectedSession.id] || "") + "\n# " + interactCommand + "\n" + (data.output || "No output")
      }));
      setInteractCommand("");
    } catch (err) {
      console.error("Interaction failed", err);
    }
  };

  const handleConnectC2 = () => {
    msf.connect("192.168.100.50", 55553, "kali", "kali", false);
  };

  return (
    <section className="fade-in-up mb-6 grid gap-6 xl:grid-cols-[1fr_1.2fr]">
      <div className="glass-card panel-shell panel-inner-glow rounded-3xl p-5">
        <div className="relative mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Session Inventory</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Live Operations</h2>
          </div>
          {!msf.status.connected ? (
            <button 
              onClick={handleConnectC2}
              className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all text-sm font-medium"
            >
              Connect to C2 (192.168.100.50)
            </button>
          ) : (
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium uppercase tracking-wider">
              C2 Connected
            </span>
          )}
        </div>

        <div className="mb-5">
          <input
            className="control-input w-full"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search sessions..."
            type="text"
            value={query}
          />
        </div>

        <div className="space-y-2 overflow-y-auto max-h-[600px] pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-800">
          {filteredSessions.map((session) => (
            <button
              className={`w-full rounded-2xl border p-4 text-left transition duration-300 ${
                selectedSession?.id === session.id
                  ? "border-emerald-400/50 bg-emerald-500/10"
                  : "border-slate-800/80 bg-slate-950/45 hover:border-slate-600 hover:bg-slate-900/80"
              }`}
              key={session.id}
              onClick={() => setSelectedMsfSessionId(session.id)}
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${session.type === "metasploit" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-sky-500/20 text-sky-400 border border-sky-500/30"}`}>
                      {session.type}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">#{session.id}</span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-white truncate max-w-[180px]">{session.hostname}</h3>
                  <p className="text-xs text-slate-400 mt-1">{session.ip} • {session.os}</p>
                </div>
                <div className="text-right">
                   <span className={`inline-block w-2 h-2 rounded-full ${session.isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <aside className="glass-card panel-shell panel-inner-glow rounded-3xl p-5 flex flex-col min-h-[700px]">
        {selectedSession ? (
          <>
            <div className="mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Operation Context</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">{selectedSession.hostname}</h2>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${riskStyle[selectedSession.risk as string] || riskStyle.low}`}>
                   {selectedSession.risk} risk
                </span>
              </div>
              
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                 <div className="bg-slate-900/50 rounded-2xl p-3 border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">User</p>
                    <p className="text-sm font-medium text-slate-200 mt-1">{selectedSession.user}</p>
                 </div>
                 <div className="bg-slate-900/50 rounded-2xl p-3 border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Arch</p>
                    <p className="text-sm font-medium text-slate-200 mt-1">{(selectedSession as any).arch || "x64"}</p>
                 </div>
                 <div className="bg-slate-900/50 rounded-2xl p-3 border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">IP Address</p>
                    <p className="text-sm font-medium text-slate-200 mt-1">{selectedSession.ip}</p>
                 </div>
                 <div className="bg-slate-900/50 rounded-2xl p-3 border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Status</p>
                    <p className="text-sm font-medium text-emerald-400 mt-1">Active</p>
                 </div>
              </div>
            </div>

            {selectedSession.type === "metasploit" ? (
              <div className="flex-1 flex flex-col bg-black/40 rounded-3xl border border-slate-800/80 overflow-hidden">
                <div className="p-3 border-b border-slate-800/80 bg-slate-900/30 flex justify-between items-center">
                   <span className="text-xs font-mono text-slate-400">Interaction Terminal</span>
                   <button onClick={() => setInteractOutput(prev => ({ ...prev, [selectedSession.id]: "" }))} className="text-[10px] text-slate-500 hover:text-slate-300">Clear</button>
                </div>
                <div className="flex-1 p-4 font-mono text-xs overflow-y-auto whitespace-pre-wrap text-emerald-400/90 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
                   {interactOutput[selectedSession.id] || "Waiting for command...\n"}
                </div>
                <form onSubmit={handleInteract} className="p-3 bg-slate-950/80 border-t border-slate-800/80">
                   <div className="flex gap-2">
                      <span className="text-emerald-500 font-bold">$</span>
                      <input 
                        type="text" 
                        value={interactCommand}
                        onChange={(e) => setInteractCommand(e.target.value)}
                        placeholder="Enter command (e.g., sysinfo, ps, getuid)..."
                        className="bg-transparent border-none outline-none text-xs text-white flex-1 font-mono"
                      />
                   </div>
                </form>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-800/50 rounded-3xl">
                 <p className="text-slate-500 text-sm">Interaction not available for simulated agents.</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mb-4 border border-slate-800">
               <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
            </div>
            <h3 className="text-lg font-medium text-white">No Session Selected</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-xs">Select an active session from the inventory to begin command interaction or view telemetry.</p>
          </div>
        )}
      </aside>
    </section>
  );
}
