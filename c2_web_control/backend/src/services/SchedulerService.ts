import { JobRepository } from "../repositories/JobRepository";
import { MetasploitService } from "./MetasploitService";

export class SchedulerService {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly jobs: JobRepository, 
    private readonly msf: MetasploitService,
    private readonly intervalMs: number
  ) {}

  start(): void {
    if (this.timer) {
      return;
    }

    this.timer = setInterval(async () => {
      try {
        // 1. Queue all scheduled jobs that are due
        await this.jobs.queueDueJobs();

        // 2. Process MSF Command jobs directly from backend
        const allJobs = await this.jobs.list();
        const queuedMsfJobs = allJobs.filter(j => j.status === 'queued' && j.type === 'msf_command');

        for (const job of queuedMsfJobs) {
          if (!this.msf.isConnected) continue;

          try {
            const sessions = await this.msf.listSessions();
            const targetSessions = job.agentId === 'all' 
              ? Object.keys(sessions) 
              : (sessions[job.agentId] ? [job.agentId] : []);

            let summaryOutput = "";
            for (const sid of targetSessions) {
              const res = await this.msf.sessionInteract(parseInt(sid), job.payload.command || "");
              summaryOutput += `[MSF-${sid}]: ${res}\n`;
            }

            await this.jobs.complete(
              parseInt(job._id), 
              targetSessions.length > 0 ? "completed" : "failed", 
              summaryOutput || "No sessions found to execute", 
              "system-scheduler"
            );
          } catch (err) {
            await this.jobs.complete(parseInt(job._id), "failed", String(err), "system-scheduler");
          }
        }
      } catch (error) {
        console.error("Scheduler loop failed", error);
      }
    }, this.intervalMs);
  }
}
