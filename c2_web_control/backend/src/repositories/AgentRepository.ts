import { Pool } from "pg";
import { AgentRecord } from "../types";

interface AgentHeartbeatPayload {
  agentId: string;
  hostname: string;
  ip: string;
  os: string;
  tags: string[];
  heartbeatAt: string;
  onlineUntil: string;
}

export class AgentRepository {
  constructor(private readonly db: Pool) {}

  async upsertHeartbeat(payload: AgentHeartbeatPayload): Promise<void> {
    await this.db.query(
      `
      INSERT INTO agents (
        agent_id, hostname, ip, os, tags_json,
        heartbeat_at, online_until, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT(agent_id) DO UPDATE SET
        hostname     = EXCLUDED.hostname,
        ip           = EXCLUDED.ip,
        os           = EXCLUDED.os,
        tags_json    = EXCLUDED.tags_json,
        heartbeat_at = EXCLUDED.heartbeat_at,
        online_until = EXCLUDED.online_until,
        updated_at   = EXCLUDED.updated_at
      `,
      [
        payload.agentId,
        payload.hostname,
        payload.ip,
        payload.os,
        JSON.stringify(payload.tags),
        payload.heartbeatAt,
        payload.onlineUntil,
        payload.heartbeatAt,
        payload.heartbeatAt,
      ]
    );
  }

  async list(nowIso: string): Promise<AgentRecord[]> {
    const { rows } = await this.db.query<{
      id: number;
      agent_id: string;
      hostname: string;
      ip: string;
      os: string;
      tags_json: string;
      heartbeat_at: string;
      online_until: string;
      created_at: string;
      updated_at: string;
    }>(`
      SELECT id, agent_id, hostname, ip, os, tags_json,
             heartbeat_at, online_until, created_at, updated_at
      FROM agents
      ORDER BY heartbeat_at DESC
    `);

    return rows.map((row) => ({
      _id: String(row.id),
      agentId: row.agent_id,
      hostname: row.hostname,
      ip: row.ip,
      os: row.os,
      tags: JSON.parse(row.tags_json || "[]"),
      heartbeatAt: row.heartbeat_at,
      onlineUntil: row.online_until,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isOnline: row.online_until > nowIso,
    }));
  }
}
