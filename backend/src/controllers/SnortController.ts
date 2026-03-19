import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "../services/AuthService";
import { SnortService } from "../services/SnortService";
import { ensureAuthorized } from "./AuthController";

export class SnortController {
  constructor(
    private readonly auth: AuthService,
    private readonly snort: SnortService
  ) {}

  register(app: FastifyInstance): void {
    app.get("/api/snort/health", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;
      return this.snort.getHealth();
    });

    app.get("/api/snort/alerts", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;
      return this.snort.getAlerts();
    });

    app.get("/api/snort/stats", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;
      return this.snort.getStats();
    });

    app.patch("/api/snort/config", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;

      const body = (request.body || {}) as { collectorUrl?: string };
      if (body.collectorUrl) {
        this.snort.updateCollectorUrl(body.collectorUrl);
      }
      return { ok: true };
    });
  }
}
