import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AgentRepository } from "../repositories/AgentRepository";
import { JobRepository } from "../repositories/JobRepository";
import { AuthService } from "../services/AuthService";
import { SecurityService } from "../services/SecurityService";
import { ensureAuthorized } from "./AuthController";
import { TimeUtil } from "../utils/time";

export class DashboardController {
  constructor(
    private readonly auth: AuthService,
    private readonly agents: AgentRepository,
    private readonly jobs: JobRepository,
    private readonly security: SecurityService
  ) {}

  register(app: FastifyInstance): void {
    app.get("/api/agents", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;
      return this.agents.list(TimeUtil.nowIso());
    });

    app.get("/api/jobs", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;
      return this.jobs.list();
    });

    app.post("/api/jobs/schedule", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;
      const body = (request.body || {}) as {
        agentId?: string;
        runAt?: string;
        type?: "http_check" | "msf_command";
        payload?: { url?: string; command?: string };
      };

      if (!body.runAt || !body.type || !body.payload) {
        return reply.code(400).send({ error: "runAt, type, payload are required" });
      }
      
      const runAtDate = new Date(body.runAt);
      if (Number.isNaN(runAtDate.getTime())) {
        return reply.code(400).send({ error: "runAt must be valid ISO datetime" });
      }

      if (body.type === "http_check") {
        if (!body.payload.url || typeof body.payload.url !== "string") {
          return reply.code(400).send({ error: "payload.url is required for http_check" });
        }
      } else if (body.type === "msf_command") {
        if (!body.payload.command || typeof body.payload.command !== "string") {
          return reply.code(400).send({ error: "payload.command is required for msf_command" });
        }
      } else {
        return reply.code(400).send({ error: "Unsupported type. Use http_check or msf_command" });
      }

      const jobId = await this.jobs.create({
        agentId: body.agentId || "all",
        runAtIso: runAtDate.toISOString(),
        type: body.type,
        payload: body.payload as any,
      });

      return { ok: true, jobId };
    });

    app.delete("/api/jobs/:jobId", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;

      const params = request.params as { jobId: string };
      const jobId = Number(params.jobId);
      if (Number.isNaN(jobId)) {
        return reply.code(400).send({ error: "invalid jobId" });
      }

      const deleted = await this.jobs.delete(jobId);
      if (!deleted) {
        return reply.code(404).send({ error: "job not found" });
      }

      return { ok: true };
    });

    app.get("/api/security/summary", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;
      const [agents, jobs] = await Promise.all([
        this.agents.list(TimeUtil.nowIso()),
        this.jobs.list(),
      ]);
      return this.security.buildSummary(agents, jobs);
    });

    app.get("/api/security/mitigation", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;
      return this.security.getMitigation();
    });

    app.patch("/api/security/mitigation", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;
      const body = (request.body || {}) as {
        rateLimitEnabled?: boolean;
        requestsPerSecondPerIp?: number;
        wafEnabled?: boolean;
        idsMode?: "IDS" | "IPS";
        autoBlockEnabled?: boolean;
      };
      return await this.security.updateMitigation(body);
    });

    app.get("/api/security/enforcement", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;
      return this.security.getEnforcement();
    });

    app.get("/api/security/proxy-health", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;
      return this.security.getProxyHealth();
    });

    app.post("/api/security/unblock", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;
      const body = (request.body || {}) as { ip?: string };
      if (!body.ip) {
        return reply.code(400).send({ error: "ip is required" });
      }
      const removed = await this.security.unblockIp(body.ip);
      return { ok: true, removed };
    });

    app.post("/api/security/unblock-all", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;
      await this.security.clearAllBlocks();
      return { ok: true };
    });
  }
}
