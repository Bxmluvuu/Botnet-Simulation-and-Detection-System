import dotenv from "dotenv";

dotenv.config();

export class AppConfig {
  public readonly port = Number(process.env.PORT || 4000);
  public readonly host = process.env.HOST || "0.0.0.0";
  public readonly clientOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  public readonly databaseUrl = process.env.DATABASE_URL || "postgresql://cyberlab:cyberlab@localhost:5432/cyberlab";
  public readonly onlineWindowSeconds = Number(process.env.ONLINE_WINDOW_SECONDS || 20);
  public readonly schedulerIntervalMs = Number(process.env.SCHEDULER_INTERVAL_MS || 1000);
  public readonly authTokenTtlHours = Number(process.env.AUTH_TOKEN_TTL_HOURS || 12);
  public readonly labAdminUsername = process.env.LAB_ADMIN_USERNAME || "admin";
  public readonly labAdminPassword = process.env.LAB_ADMIN_PASSWORD || "admin123";
  public readonly snortCollectorUrl = process.env.SNORT_COLLECTOR_URL || "http://192.168.100.54:5555";
  public readonly targetProxyUrl = process.env.TARGET_PROXY_URL || "http://192.168.100.53:5555";
}
