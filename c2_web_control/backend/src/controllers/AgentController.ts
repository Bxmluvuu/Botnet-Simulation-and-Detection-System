import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AgentRepository } from "../repositories/AgentRepository";
import { JobRepository } from "../repositories/JobRepository";
import { TimeUtil } from "../utils/time";

export class AgentController {
  constructor(private readonly agents: AgentRepository, private readonly jobs: JobRepository, private readonly onlineWindowSeconds: number) {}

  register(app: FastifyInstance): void {
    app.post("/api/agents/heartbeat", async (request: FastifyRequest, reply: FastifyReply) => {
      const body = (request.body || {}) as {
        agentId?: string;
        hostname?: string;
        ip?: string;
        os?: string;
        tags?: string[];
      };

      if (!body.agentId || !body.hostname || !body.ip || !body.os) {
        return reply.code(400).send({ error: "agentId, hostname, ip, os are required" });
      }

      const heartbeatAt = TimeUtil.nowIso();
      const onlineUntil = new Date(Date.now() + this.onlineWindowSeconds * 1000).toISOString();
      await this.agents.upsertHeartbeat({
        agentId: body.agentId,
        hostname: body.hostname,
        ip: body.ip,
        os: body.os,
        tags: Array.isArray(body.tags) ? body.tags : [],
        heartbeatAt,
        onlineUntil,
      });

      return { ok: true, heartbeatAt };
    });

    app.get("/api/jobs/due", async (request: FastifyRequest, reply: FastifyReply) => {
      const query = (request.query || {}) as { agentId?: string };
      if (!query.agentId) {
        return reply.code(400).send({ error: "agentId query is required" });
      }
      const job = await this.jobs.pickDueForAgent(query.agentId);
      return { ok: true, job };
    });

    app.post("/api/jobs/:jobId/result", async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as { jobId: string };
      const body = (request.body || {}) as { status?: "completed" | "failed"; output?: string; agentId?: string };
      if (!body.status || !body.agentId) {
        return reply.code(400).send({ error: "status and agentId are required" });
      }
      if (!["completed", "failed"].includes(body.status)) {
        return reply.code(400).send({ error: "status must be completed or failed" });
      }

      const jobId = Number(params.jobId);
      if (Number.isNaN(jobId)) {
        return reply.code(400).send({ error: "invalid jobId" });
      }

      const updated = await this.jobs.complete(jobId, body.status, body.output || null, body.agentId);
      if (!updated) {
        return reply.code(404).send({ error: "job not found" });
      }
      return { ok: true };
    });
  }
}
