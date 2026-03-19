import type { MsfSession } from "../hooks/useMetasploit";

interface SessionsPanelProps {
  msfSessions: MsfSession[];
  onOpenSessions: () => void;
}

export function SessionsPanel({ msfSessions, onOpenSessions }: SessionsPanelProps) {
  const sessions = msfSessions.map(s => ({
    id: `msf-${s.id}`,
    agentId: s.id,
    hostname: s.session_host,
    user: s.username || "unknown",
    isOnline: true,
    privilege: "elevated",
    latencyMs: 45,
    transport: s.type,
    ip: s.session_host,
    os: s.platform,
    heartbeatAt: new Date().toISOString(),
    lastAction: s.info
  })).slice(0, 3);

  return (
    <section className="glass-card panel-shell panel-inner-glow fade-in-up mb-6 rounded-3xl p-5">
      <div className="relative mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Active Operations</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Live Metasploit Preview</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Real-time control over established Metasploit sessions.
          </p>
        </div>
        <button
          className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-500/15"
          onClick={onOpenSessions}
          type="button"
        >
          Manage All Sessions
        </button>
      </div>

      <div className="relative grid gap-4 xl:grid-cols-3">
        {sessions.map((session) => (
          <article
            className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 transition duration-300 hover:-translate-y-1 hover:border-rose-400/50 hover:bg-rose-500/10 shadow-[0_4px_20px_-10px_rgba(244,63,94,0.3)]"
            key={session.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-rose-400 font-bold">MSF-{session.agentId}</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{session.hostname}</h3>
                <p className="mt-1 text-sm text-slate-400">{session.user}</p>
              </div>
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-900/70 p-3 border border-slate-800/50">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Platform</p>
                <p className="mt-1 font-medium text-slate-200">{session.os}</p>
              </div>
              <div className="rounded-xl bg-slate-900/70 p-3 border border-slate-800/50">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Privilege</p>
                <p className="mt-1 font-medium text-rose-400">{session.privilege}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span>Tunnel</span>
                <span className="text-slate-200 font-mono text-xs">{session.ip}</span>
              </div>
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-rose-200 text-xs italic">
                Info: {session.lastAction}
              </div>
            </div>
          </article>
        ))}

        {msfSessions.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-800/80 bg-slate-950/45 p-12 text-center text-slate-500 xl:col-span-3">
            <div className="mb-4 flex justify-center">
              <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                 <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                 </svg>
              </div>
            </div>
            <p className="font-medium text-slate-400">No established Metasploit sessions</p>
            <p className="text-xs mt-2">Check msfrpcd connection or await incoming payloads.</p>
          </div>
        )}
      </div>
    </section>
  );
}
