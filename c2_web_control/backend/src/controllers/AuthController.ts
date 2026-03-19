import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "../services/AuthService";

function getBearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length).trim();
}

export class AuthController {
  constructor(private readonly auth: AuthService) {}

  register(app: FastifyInstance): void {
    app.post("/api/auth/login", async (request: FastifyRequest, reply: FastifyReply) => {
      const body = (request.body || {}) as { username?: string; password?: string };
      if (!body.username || !body.password) {
        return reply.code(400).send({ error: "username and password are required" });
      }

      const session = this.auth.login(body.username, body.password);
      if (!session) {
        return reply.code(401).send({ error: "Invalid credentials" });
      }

      return { ok: true, ...session };
    });

    app.get("/api/auth/me", async (request: FastifyRequest, reply: FastifyReply) => {
      const token = getBearerToken(request);
      const session = this.auth.verify(token);
      if (!session || !token) {
        return reply.code(401).send({ error: "Unauthorized" });
      }
      return { ok: true, username: session.username, expiresAt: session.expiresAt };
    });

    app.post("/api/auth/logout", async (request: FastifyRequest, reply: FastifyReply) => {
      const token = getBearerToken(request);
      const session = this.auth.verify(token);
      if (!session || !token) {
        return reply.code(401).send({ error: "Unauthorized" });
      }
      this.auth.logout(token);
      return { ok: true };
    });
  }
}

export function ensureAuthorized(auth: AuthService, request: FastifyRequest, reply: FastifyReply): boolean {
  const token = getBearerToken(request);
  const session = auth.verify(token);
  if (!session) {
    reply.code(401).send({ error: "Unauthorized" });
    return false;
  }
  return true;
}
