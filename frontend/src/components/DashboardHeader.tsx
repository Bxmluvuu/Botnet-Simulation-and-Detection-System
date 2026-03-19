interface DashboardHeaderProps {
  apiBase: string;
  onlineCount: number;
  totalAgents: number;
  activeView: "overview" | "sessions" | "metasploit" | "snort";
  onChangeView: (view: "overview" | "sessions" | "metasploit" | "snort") => void;
  onLogout: () => Promise<void>;
  msfConnected?: boolean;
  snortConnected?: boolean;
}

export function DashboardHeader({
  apiBase,
  onlineCount,
  totalAgents,
  activeView,
  onChangeView,
  onLogout,
  msfConnected,
  snortConnected,
}: DashboardHeaderProps) {
  return (
    <header className="glass-card panel-shell panel-inner-glow fade-in-up mb-6 rounded-3xl p-6 sm:p-7">
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-emerald-300">
            Control Center
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Security operations dashboard for your defensive lab demo.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Review bot availability, inspect detection signals, and tune prevention controls in one
            polished workflow.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="status-pill">API {apiBase || window.location.origin}</span>
            <span className="status-pill">
              Live agents {onlineCount}/{totalAgents}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition duration-300 ${
                activeView === "overview"
                  ? "bg-emerald-500 text-slate-950"
                  : "border border-slate-700/80 bg-slate-950/60 text-slate-200 hover:border-slate-500 hover:bg-slate-900"
              }`}
              onClick={() => onChangeView("overview")}
              type="button"
            >
              Overview
            </button>
            <button
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition duration-300 ${
                activeView === "sessions"
                  ? "bg-emerald-500 text-slate-950"
                  : "border border-slate-700/80 bg-slate-950/60 text-slate-200 hover:border-slate-500 hover:bg-slate-900"
              }`}
              onClick={() => onChangeView("sessions")}
              type="button"
            >
              Sessions
            </button>
            <button
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition duration-300 ${
                activeView === "metasploit"
                  ? "bg-emerald-500 text-slate-950"
                  : "border border-slate-700/80 bg-slate-950/60 text-slate-200 hover:border-slate-500 hover:bg-slate-900"
              }`}
              onClick={() => onChangeView("metasploit")}
              type="button"
            >
              Metasploit
              {msfConnected && (
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              )}
            </button>
            <button
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition duration-300 ${
                activeView === "snort"
                  ? "bg-emerald-500 text-slate-950"
                  : "border border-slate-700/80 bg-slate-950/60 text-slate-200 hover:border-slate-500 hover:bg-slate-900"
              }`}
              onClick={() => onChangeView("snort")}
              type="button"
            >
              Snort IDS
              {snortConnected && (
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              )}
            </button>
          </div>
        </div>
        <button
          className="rounded-2xl border border-slate-700/80 bg-slate-950/60 px-4 py-3 text-sm text-slate-200 transition duration-300 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-900"
          onClick={() => void onLogout()}
          type="button"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
