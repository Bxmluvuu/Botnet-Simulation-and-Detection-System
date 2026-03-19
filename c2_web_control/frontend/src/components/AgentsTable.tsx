import type { MsfSession } from "../hooks/useMetasploit";

interface AgentsTableProps {
  msfSessions: MsfSession[];
}

export function AgentsTable({ msfSessions }: AgentsTableProps) {
  return (
    <section className="glass-card panel-shell panel-inner-glow fade-in-up mb-6 rounded-3xl p-5">
      <div className="relative mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Inventory</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Metasploit Sessions</h2>
        </div>
        <span className="status-pill">{msfSessions.length} active sessions</span>
      </div>
      <div className="relative overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-[11px] uppercase tracking-[0.18em] text-slate-500">
              <th className="px-4 py-3">Session ID</th>
              <th className="px-4 py-3">Host (Tunnel)</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3">Payload Info</th>
              <th className="px-4 py-3">State</th>
            </tr>
          </thead>
          <tbody>
            {msfSessions.map((s) => (
              <tr key={s.id} className="border-b border-slate-900/80 transition duration-200 hover:bg-slate-900/60">
                <td className="px-4 py-3 font-medium text-rose-400">MSF-{s.id}</td>
                <td className="px-4 py-3 text-slate-300 font-mono text-xs">{s.session_host}</td>
                <td className="px-4 py-3 text-slate-300">{s.username || "unknown"}</td>
                <td className="px-4 py-3 text-slate-300">{s.platform} / {s.arch}</td>
                <td className="px-4 py-3 text-slate-400 text-xs truncate max-w-[200px]" title={s.info}>{s.info}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">active</span>
                </td>
              </tr>
            ))}
            {msfSessions.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                  No active Metasploit sessions detected. Connect to C2 and deploy a payload.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
