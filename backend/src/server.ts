import Fastify from "fastify";
import cors from "@fastify/cors";
import { AppConfig } from "./config/AppConfig";
import { PostgresDatabase } from "./infrastructure/PostgresDatabase";
import { AgentRepository } from "./repositories/AgentRepository";
import { JobRepository } from "./repositories/JobRepository";
import { AuthService } from "./services/AuthService";
import { SchedulerService } from "./services/SchedulerService";
import { SecurityService } from "./services/SecurityService";
import { MetasploitService } from "./services/MetasploitService";
import { SnortService } from "./services/SnortService";
import { AuthController } from "./controllers/AuthController";
import { AgentController } from "./controllers/AgentController";
import { DashboardController } from "./controllers/DashboardController";
import { MetasploitController } from "./controllers/MetasploitController";
import { SnortController } from "./controllers/SnortController";
import { TimeUtil } from "./utils/time";

class Application {
  private readonly config = new AppConfig();
  private readonly app = Fastify({ logger: true });

  async start(): Promise<void> {
    const pool = await new PostgresDatabase(this.config.databaseUrl).connect();
    const agentRepository = new AgentRepository(pool);
    const jobRepository = new JobRepository(pool);
    const authService = new AuthService(
      this.config.labAdminUsername,
      this.config.labAdminPassword,
      this.config.authTokenTtlHours
    );
    const securityService = new SecurityService(this.config.targetProxyUrl);
    const metasploitService = new MetasploitService();
    const snortService = new SnortService(this.config.snortCollectorUrl);

    await this.app.register(cors, {
      origin: (origin, callback) => {
        if (!origin || this.config.clientOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("CORS blocked"), false);
      },
      methods: ["GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    });

    this.app.get("/health", async () => ({
      ok: true,
      service: "botnet-lab-sim-backend",
      time: TimeUtil.nowIso(),
    }));

    const scheduler = new SchedulerService(jobRepository, metasploitService, this.config.schedulerIntervalMs);
    scheduler.start();

    snortService.start(3000);
    securityService.startPolling(3000);

    setInterval(() => {
      const alerts = snortService.getAlerts();
      void securityService.syncSnortAlerts(alerts);
    }, 5000);

    new AuthController(authService).register(this.app);
    new AgentController(agentRepository, jobRepository, this.config.onlineWindowSeconds).register(this.app);
    new DashboardController(authService, agentRepository, jobRepository, securityService).register(this.app);
    new MetasploitController(authService, metasploitService).register(this.app);
    new SnortController(authService, snortService).register(this.app);

    await this.app.listen({ port: this.config.port, host: this.config.host });
  }
}

new Application()
  .start()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
