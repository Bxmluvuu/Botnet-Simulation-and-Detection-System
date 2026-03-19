import { Pool } from "pg";

export class PostgresDatabase {
  private pool: Pool | null = null;

  constructor(private readonly connectionString: string) {}

  async connect(): Promise<Pool> {
    if (this.pool) return this.pool;

    this.pool = new Pool({ connectionString: this.connectionString });

    await this.pool.query("SELECT 1");
    await this.runMigrations();
    return this.pool;
  }

  private async runMigrations(): Promise<void> {
    if (!this.pool) throw new Error("Not connected");

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS agents (
        id            SERIAL PRIMARY KEY,
        agent_id      TEXT NOT NULL UNIQUE,
        hostname      TEXT NOT NULL,
        ip            TEXT NOT NULL,
        os            TEXT NOT NULL,
        tags_json     TEXT NOT NULL DEFAULT '[]',
        heartbeat_at  TEXT NOT NULL,
        online_until  TEXT NOT NULL,
        created_at    TEXT NOT NULL,
        updated_at    TEXT NOT NULL
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id              SERIAL PRIMARY KEY,
        agent_id        TEXT NOT NULL,
        run_at_iso      TEXT NOT NULL,
        type            TEXT NOT NULL,
        payload_json    TEXT NOT NULL,
        status          TEXT NOT NULL,
        output          TEXT,
        queued_at       TEXT,
        dispatched_at   TEXT,
        dispatched_to   TEXT,
        completed_by    TEXT,
        completed_at    TEXT,
        created_at      TEXT NOT NULL,
        updated_at      TEXT NOT NULL
      );
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_jobs_status_run_at ON jobs(status, run_at_iso);
    `);
  }
}
