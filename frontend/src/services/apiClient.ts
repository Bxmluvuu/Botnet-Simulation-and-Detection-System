const envBase = import.meta.env.VITE_API_BASE;

export const API_BASE = envBase !== undefined && envBase !== ""
  ? envBase
  : "";

export class ApiClient {
  constructor(
    private readonly getToken: () => string,
    private readonly onUnauthorized: () => void
  ) {}

  async request(path: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers || {});
    const token = this.getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.onUnauthorized();
    }
    return response;
  }
}
