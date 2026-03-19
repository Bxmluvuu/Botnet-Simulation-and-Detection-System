import { Pool } from "pg";
import { JobRecord } from "../types";
import { TimeUtil } from "../utils/time";

interface CreateJobPayload {
  agentId: string;
  runAtIso: string;
  type: "http_check";
  payload: { url: string };
}

export class JobRepository {
  constructor(private readonly db: Pool) {}

  async queueDueJobs(): Promise<void> {
    const stamp = TimeUtil.nowIso();
    await this.db.query(
      `
      UPDATE jobs
      SET status     = 'queued',
          queued_at  = $1,
          updated_at = $2
      WHERE status = 'scheduled'
        AND run_at_iso <= $3
      `,
      [stamp, stamp, stamp]
    );
  }

  async create(payload: CreateJobPayload): Promise<string> {
    const stamp = TimeUtil.nowIso();
    const { rows } = await this.db.query<{ id: number }>(
      `
      INSERT INTO jobs (
        agent_id, run_at_iso, type, payload_json, status,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, 'scheduled', $5, $6)
      RETURNING id
      `,
      [
        payload.agentId,
        payload.runAtIso,
        payload.type,
        JSON.stringify(payload.payload),
        stamp,
        stamp,
      ]
    );

    return String(rows[0].id);
  }

  async list(): Promise<JobRecord[]> {
    const { rows } = await this.db.query<{
      id: number;
      agent_id: string;
      run_at_iso: string;
      type: "http_check";
      payload_json: string;
      status: JobRecord["status"];
      output: string | null;
      queued_at: string | null;
      dispatched_at: string | null;
      dispatched_to: string | null;
      completed_by: string | null;
      completed_at: string | null;
      created_at: string;
      updated_at: string;
    }>(`
      SELECT id, agent_id, run_at_iso, type, payload_json, status, output,
             queued_at, dispatched_at, dispatched_to, completed_by, completed_at,
             created_at, updated_at
      FROM jobs
      ORDER BY run_at_iso DESC
      LIMIT 100
    `);

    return rows.map((row) => ({
      _id: String(row.id),
      agentId: row.agent_id,
      runAtIso: row.run_at_iso,
      type: row.type,
      payload: JSON.parse(row.payload_json || "{}"),
      status: row.status,
      output: row.output,
      queuedAt: row.queued_at,
      dispatchedAt: row.dispatched_at,
      dispatchedTo: row.dispatched_to,
      completedBy: row.completed_by,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async pickDueForAgent(agentId: string): Promise<JobRecord | null> {
    const client = await this.db.connect();
    try {
      await client.query("BEGIN");

      const { rows } = await client.query(
        `
        SELECT id, agent_id, run_at_iso, type, payload_json, status, output,
               queued_at, dispatched_at, dispatched_to, completed_by, completed_at,
               created_at, updated_at
        FROM jobs
        WHERE status = 'queued'
          AND (agent_id = $1 OR agent_id = 'all')
        ORDER BY run_at_iso ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
        `,
        [agentId]
      );

      if (rows.length === 0) {
        await client.query("COMMIT");
        return null;
      }

      const row = rows[0];
      const stamp = TimeUtil.nowIso();

      await client.query(
        `
        UPDATE jobs
        SET status        = 'dispatched',
            dispatched_at = $1,
            updated_at    = $2,
            dispatched_to = $3
        WHERE id = $4
        `,
        [stamp, stamp, agentId, row.id]
      );

      await client.query("COMMIT");

      return {
        _id: String(row.id),
        agentId: row.agent_id,
        runAtIso: row.run_at_iso,
        type: row.type,
        payload: JSON.parse(row.payload_json || "{}"),
        status: "dispatched",
        output: row.output,
        queuedAt: row.queued_at,
        dispatchedAt: stamp,
        dispatchedTo: agentId,
        completedBy: row.completed_by,
        completedAt: row.completed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async complete(jobId: number, status: "completed" | "failed", output: string | null, agentId: string): Promise<boolean> {
    const stamp = TimeUtil.nowIso();
    const result = await this.db.query(
      `
      UPDATE jobs
      SET status       = $1,
          output       = $2,
          completed_by = $3,
          completed_at = $4,
          updated_at   = $5
      WHERE id = $6
      `,
      [status, output, agentId, stamp, stamp, jobId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async delete(jobId: number): Promise<boolean> {
    const result = await this.db.query(
      `DELETE FROM jobs WHERE id = $1`,
      [jobId]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
