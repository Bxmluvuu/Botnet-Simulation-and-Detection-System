import type { Job } from "../types";
import { fmtDate } from "../utils/format";

interface JobsTableProps {
  jobs: Job[];
  onDeleteJob: (jobId: string) => Promise<boolean>;
}

export function JobsTable({ jobs, onDeleteJob }: JobsTableProps) {
  return (
    <section className="glass-card panel-shell panel-inner-glow fade-in-up rounded-3xl p-5">
      <div className="relative mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Execution Log</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Recent jobs</h2>
        </div>
        <span className="status-pill">{jobs.length} entries</span>
      </div>
      <div className="relative overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-[11px] uppercase tracking-[0.18em] text-slate-500">
              <th className="px-4 py-3">Run At</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Payload</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job._id} className="border-b border-slate-900/80 transition duration-200 hover:bg-slate-900/60">
                <td className="px-4 py-3 text-slate-300">{fmtDate(job.runAtIso)}</td>
                <td className="px-4 py-3 text-slate-300">{job.type}</td>
                <td className="px-4 py-3 font-medium text-white">{job.agentId}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium capitalize text-slate-200">
                    {job.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{JSON.stringify(job.payload)}</td>
                <td className="px-4 py-3">
                  <button
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300 transition duration-300 hover:bg-rose-500/20"
                    onClick={() => void onDeleteJob(job._id)}
                    type="button"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={6}>
                  No jobs
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
