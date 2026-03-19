import { encode, decode } from "@msgpack/msgpack";

const rpcTextDecoder = new TextDecoder();

function rpcMapKeyConverter(key: unknown): string | number {
  if (typeof key === "string" || typeof key === "number") {
    return key;
  }

  if (key instanceof Uint8Array) {
    return rpcTextDecoder.decode(key);
  }

  return String(key);
}

function normalizeRpcValue(value: unknown): unknown {
  if (value instanceof Uint8Array) {
    return rpcTextDecoder.decode(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeRpcValue(item));
  }

  if (value instanceof Map) {
    return Object.fromEntries(
      Array.from(value.entries(), ([key, item]) => [rpcMapKeyConverter(key), normalizeRpcValue(item)])
    );
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, normalizeRpcValue(item)])
    );
  }

  return value;
}

export interface MsfSession {
  id: number;
  type: string;
  tunnel_local: string;
  tunnel_peer: string;
  via_exploit: string;
  via_payload: string;
  desc: string;
  info: string;
  workspace: string;
  session_host: string;
  session_port: number;
  target_host: string;
  username: string;
  uuid: string;
  exploit_uuid: string;
  routes: string;
  arch: string;
  platform: string;
}

export interface MsfModuleInfo {
  name: string;
  fullname: string;
  aliases: string[];
  rank: number;
  description: string;
  author: string[];
  references: string[];
  platform: string;
  arch: string;
  options: Record<string, unknown>;
}

export interface MsfConsoleInfo {
  id: string;
  prompt: string;
  busy: boolean;
}

export interface MsfConsoleOutput {
  data: string;
  prompt: string;
  busy: boolean;
}

export class MetasploitService {
  private token: string | null = null;
  private rpcUrl: string = "";
  private consoles: Map<string, boolean> = new Map();

  get isConnected(): boolean {
    return this.token !== null;
  }

  get currentRpcUrl(): string {
    return this.rpcUrl;
  }

  private async rpcCall(method: string, ...args: unknown[]): Promise<Record<string, unknown>> {
    const body = encode([method, ...args]);

    const response = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "binary/message-pack" },
      body: Buffer.from(body),
    });

    if (!response.ok) {
      throw new Error(`MSFRPC HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const result = normalizeRpcValue(
      decode(new Uint8Array(buffer), { mapKeyConverter: rpcMapKeyConverter })
    ) as Record<string, unknown>;

    if (result.error === true) {
      const message = typeof result.error_message === "string" ? result.error_message : "Unknown RPC error";
      throw new Error(message);
    }

    return result;
  }

  async connect(host: string, port: number, username: string, password: string, ssl: boolean = false): Promise<{ version: string; ruby: string }> {
    const scheme = ssl ? "https" : "http";
    this.rpcUrl = `${scheme}://${host}:${port}/api/`;

    const authResult = await this.rpcCall("auth.login", username, password);

    if (authResult.result !== "success") {
      this.rpcUrl = "";
      throw new Error("Authentication failed");
    }

    this.token = authResult.token as string;

    const versionResult = await this.rpcCall("core.version", this.token);
    return {
      version: (versionResult.version as string) || "unknown",
      ruby: (versionResult.ruby as string) || "unknown",
    };
  }

  async disconnect(): Promise<void> {
    if (this.token) {
      try {
        for (const [consoleId] of this.consoles) {
          await this.rpcCall("console.destroy", this.token, consoleId).catch(() => {});
        }
        await this.rpcCall("auth.token_remove", this.token, this.token);
      } catch {
        // best-effort
      }
      this.token = null;
      this.rpcUrl = "";
      this.consoles.clear();
    }
  }

  async getStatus(): Promise<{ connected: boolean; rpcUrl: string; version?: string }> {
    if (!this.token) {
      return { connected: false, rpcUrl: "" };
    }

    try {
      const result = await this.rpcCall("core.version", this.token);
      return {
        connected: true,
        rpcUrl: this.rpcUrl,
        version: (result.version as string) || "unknown",
      };
    } catch {
      this.token = null;
      return { connected: false, rpcUrl: this.rpcUrl };
    }
  }

  async listSessions(): Promise<Record<string, MsfSession>> {
    if (!this.token) throw new Error("Not connected to msfrpcd");
    const result = await this.rpcCall("session.list", this.token);
    return result as unknown as Record<string, MsfSession>;
  }

  async listExploits(): Promise<string[]> {
    if (!this.token) throw new Error("Not connected to msfrpcd");
    const result = await this.rpcCall("module.exploits", this.token);
    return (result.modules as string[]) || [];
  }

  async listPayloads(): Promise<string[]> {
    if (!this.token) throw new Error("Not connected to msfrpcd");
    const result = await this.rpcCall("module.payloads", this.token);
    return (result.modules as string[]) || [];
  }

  async listAuxiliary(): Promise<string[]> {
    if (!this.token) throw new Error("Not connected to msfrpcd");
    const result = await this.rpcCall("module.auxiliary", this.token);
    return (result.modules as string[]) || [];
  }

  async getModuleInfo(moduleType: string, moduleName: string): Promise<MsfModuleInfo> {
    if (!this.token) throw new Error("Not connected to msfrpcd");
    const result = await this.rpcCall("module.info", this.token, moduleType, moduleName);
    return result as unknown as MsfModuleInfo;
  }

  async searchModules(query: string): Promise<Array<{ fullname: string; name: string; type: string; rank: number; description: string }>> {
    if (!this.token) throw new Error("Not connected to msfrpcd");
    const result = await this.rpcCall("module.search", this.token, query);
    return (result as unknown as Array<{ fullname: string; name: string; type: string; rank: number; description: string }>) || [];
  }

  async consoleCreate(): Promise<MsfConsoleInfo> {
    if (!this.token) throw new Error("Not connected to msfrpcd");
    const result = await this.rpcCall("console.create", this.token);
    const id = String(result.id);
    this.consoles.set(id, true);
    return {
      id,
      prompt: (result.prompt as string) || "",
      busy: Boolean(result.busy),
    };
  }

  async consoleWrite(consoleId: string, command: string): Promise<number> {
    if (!this.token) throw new Error("Not connected to msfrpcd");
    const cmd = command.endsWith("\n") ? command : command + "\n";
    const result = await this.rpcCall("console.write", this.token, consoleId, cmd);
    return (result.wrote as number) || 0;
  }

  async consoleRead(consoleId: string): Promise<MsfConsoleOutput> {
    if (!this.token) throw new Error("Not connected to msfrpcd");
    const result = await this.rpcCall("console.read", this.token, consoleId);
    return {
      data: (result.data as string) || "",
      prompt: (result.prompt as string) || "",
      busy: Boolean(result.busy),
    };
  }

  async consoleDestroy(consoleId: string): Promise<void> {
    if (!this.token) throw new Error("Not connected to msfrpcd");
    await this.rpcCall("console.destroy", this.token, consoleId);
    this.consoles.delete(consoleId);
  }

  async sessionInteract(sessionId: number, command: string): Promise<string> {
    if (!this.token) throw new Error("Not connected to msfrpcd");
    
    // 1. Get session type first
    const sessions = await this.listSessions();
    const session = sessions[String(sessionId)];
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const isMeterpreter = session.type === "meterpreter";
    const writeMethod = isMeterpreter ? "session.meterpreter_write" : "session.shell_write";
    const readMethod = isMeterpreter ? "session.meterpreter_read" : "session.shell_read";

    const cmd = command.endsWith("\n") ? command : command + "\n";
    
    // 2. Write command
    await this.rpcCall(writeMethod, this.token, String(sessionId), cmd);

    // 3. Wait for execution and output buffer to fill
    await new Promise((r) => setTimeout(r, 1000));

    // 4. Read response (up to 3 times if empty, as RPC can be async)
    let finalOutput = "";
    for (let i = 0; i < 2; i++) {
      const result = await this.rpcCall(readMethod, this.token, String(sessionId));
      const data = (result.data as string) || "";
      if (data) {
        finalOutput += data;
        break; 
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    return finalOutput || "Command sent (No immediate output)";
  }

  async sessionStop(sessionId: number): Promise<void> {
    if (!this.token) throw new Error("Not connected to msfrpcd");
    await this.rpcCall("session.stop", this.token, String(sessionId));
  }
}
