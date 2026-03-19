import crypto from "crypto";
import { SessionData } from "../types";
import { TimeUtil } from "../utils/time";

export class AuthService {
  private readonly sessions = new Map<string, SessionData>();

  constructor(
    private readonly validUsername: string,
    private readonly validPassword: string,
    private readonly ttlHours: number
  ) {}

  login(username: string, password: string): { token: string; expiresAt: string; username: string } | null {
    if (username !== this.validUsername || password !== this.validPassword) {
      return null;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + this.ttlHours * 60 * 60 * 1000).toISOString();
    this.sessions.set(token, { username, expiresAt });
    return { token, expiresAt, username };
  }

  verify(token: string | null): SessionData | null {
    if (!token) {
      return null;
    }

    const session = this.sessions.get(token);
    if (!session) {
      return null;
    }

    if (session.expiresAt <= TimeUtil.nowIso()) {
      this.sessions.delete(token);
      return null;
    }
    return session;
  }

  logout(token: string): void {
    this.sessions.delete(token);
  }
}
