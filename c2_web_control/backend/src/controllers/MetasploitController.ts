import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "../services/AuthService";
import { MetasploitService } from "../services/MetasploitService";
import { ensureAuthorized } from "./AuthController";

export class MetasploitController {
  constructor(
    private readonly auth: AuthService,
    private readonly msf: MetasploitService
  ) {}

  register(app: FastifyInstance): void {
    app.post("/api/msf/connect", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;

      const body = (request.body || {}) as {
        host?: string;
        port?: number;
        username?: string;
        password?: string;
        ssl?: boolean;
      };

      if (!body.host || !body.port || !body.username || !body.password) {
        return reply.code(400).send({ error: "host, port, username, and password are required" });
      }

      try {
        const info = await this.msf.connect(body.host, body.port, body.username, body.password, body.ssl);
        return { ok: true, ...info };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Connection failed";
        return reply.code(502).send({ error: message });
      }
    });

    app.post("/api/msf/disconnect", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;

      try {
        await this.msf.disconnect();
        return { ok: true };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Disconnect failed";
        return reply.code(500).send({ error: message });
      }
    });

    app.get("/api/msf/status", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;
      return this.msf.getStatus();
    });

    app.get("/api/msf/sessions", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;

      if (!this.msf.isConnected) {
        return reply.code(400).send({ error: "Not connected to msfrpcd" });
      }

      try {
        const sessions = await this.msf.listSessions();
        return sessions;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to list sessions";
        return reply.code(500).send({ error: message });
      }
    });

    app.get("/api/msf/modules/exploits", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;

      if (!this.msf.isConnected) {
        return reply.code(400).send({ error: "Not connected to msfrpcd" });
      }

      try {
        const modules = await this.msf.listExploits();
        return { modules };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to list exploits";
        return reply.code(500).send({ error: message });
      }
    });

    app.get("/api/msf/modules/payloads", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;

      if (!this.msf.isConnected) {
        return reply.code(400).send({ error: "Not connected to msfrpcd" });
      }

      try {
        const modules = await this.msf.listPayloads();
        return { modules };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to list payloads";
        return reply.code(500).send({ error: message });
      }
    });

    app.get("/api/msf/modules/auxiliary", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;

      if (!this.msf.isConnected) {
        return reply.code(400).send({ error: "Not connected to msfrpcd" });
      }

      try {
        const modules = await this.msf.listAuxiliary();
        return { modules };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to list auxiliary modules";
        return reply.code(500).send({ error: message });
      }
    });

    app.post("/api/msf/modules/info", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;

      if (!this.msf.isConnected) {
        return reply.code(400).send({ error: "Not connected to msfrpcd" });
      }

      const body = (request.body || {}) as { type?: string; name?: string };
      if (!body.type || !body.name) {
        return reply.code(400).send({ error: "type and name are required" });
      }

      try {
        const info = await this.msf.getModuleInfo(body.type, body.name);
        return info;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to get module info";
        return reply.code(500).send({ error: message });
      }
    });

    app.post("/api/msf/modules/search", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;

      if (!this.msf.isConnected) {
        return reply.code(400).send({ error: "Not connected to msfrpcd" });
      }

      const body = (request.body || {}) as { query?: string };
      if (!body.query) {
        return reply.code(400).send({ error: "query is required" });
      }

      try {
        const results = await this.msf.searchModules(body.query);
        return { results };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Search failed";
        return reply.code(500).send({ error: message });
      }
    });

    app.post("/api/msf/console/create", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;

      if (!this.msf.isConnected) {
        return reply.code(400).send({ error: "Not connected to msfrpcd" });
      }

      try {
        const console = await this.msf.consoleCreate();
        return console;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to create console";
        return reply.code(500).send({ error: message });
      }
    });

    app.post("/api/msf/console/write", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;

      if (!this.msf.isConnected) {
        return reply.code(400).send({ error: "Not connected to msfrpcd" });
      }

      const body = (request.body || {}) as { consoleId?: string; command?: string };
      if (!body.consoleId || !body.command) {
        return reply.code(400).send({ error: "consoleId and command are required" });
      }

      try {
        const wrote = await this.msf.consoleWrite(body.consoleId, body.command);
        return { ok: true, wrote };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to write to console";
        return reply.code(500).send({ error: message });
      }
    });

    app.post("/api/msf/console/read", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;

      if (!this.msf.isConnected) {
        return reply.code(400).send({ error: "Not connected to msfrpcd" });
      }

      const body = (request.body || {}) as { consoleId?: string };
      if (!body.consoleId) {
        return reply.code(400).send({ error: "consoleId is required" });
      }

      try {
        const output = await this.msf.consoleRead(body.consoleId);
        return output;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to read console";
        return reply.code(500).send({ error: message });
      }
    });

    app.post("/api/msf/console/destroy", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;

      if (!this.msf.isConnected) {
        return reply.code(400).send({ error: "Not connected to msfrpcd" });
      }

      const body = (request.body || {}) as { consoleId?: string };
      if (!body.consoleId) {
        return reply.code(400).send({ error: "consoleId is required" });
      }

      try {
        await this.msf.consoleDestroy(body.consoleId);
        return { ok: true };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to destroy console";
        return reply.code(500).send({ error: message });
      }
    });

    app.post("/api/msf/session/interact", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;

      if (!this.msf.isConnected) {
        return reply.code(400).send({ error: "Not connected to msfrpcd" });
      }

      const body = (request.body || {}) as { sessionId?: number; command?: string };
      if (body.sessionId === undefined || !body.command) {
        return reply.code(400).send({ error: "sessionId and command are required" });
      }

      try {
        const output = await this.msf.sessionInteract(body.sessionId, body.command);
        return { output };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Session interaction failed";
        return reply.code(500).send({ error: message });
      }
    });

    app.post("/api/msf/session/stop", async (request: FastifyRequest, reply: FastifyReply) => {
      if (!ensureAuthorized(this.auth, request, reply)) return;

      if (!this.msf.isConnected) {
        return reply.code(400).send({ error: "Not connected to msfrpcd" });
      }

      const body = (request.body || {}) as { sessionId?: number };
      if (body.sessionId === undefined) {
        return reply.code(400).send({ error: "sessionId is required" });
      }

      try {
        await this.msf.sessionStop(body.sessionId);
        return { ok: true };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to stop session";
        return reply.code(500).send({ error: message });
      }
    });
  }
}
