import { useMemo, useState } from "react";
import { ApiClient, API_BASE } from "../services/apiClient";
import type { ApiError, LoginResponse } from "../types";

export function useAuth() {
  const [token, setToken] = useState<string>(() => localStorage.getItem("lab_token") || "");

  const clearSession = () => {
    localStorage.removeItem("lab_token");
    setToken("");
  };

  const api = useMemo(() => new ApiClient(() => token, clearSession), [token]);

  async function login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = (await response.json()) as LoginResponse | ApiError;
    if (!response.ok) {
      const err = data as ApiError;
      throw new Error(err.error || "Login failed");
    }

    const loginData = data as LoginResponse;
    localStorage.setItem("lab_token", loginData.token);
    setToken(loginData.token);
    return loginData;
  }

  async function logout() {
    if (token) {
      await api.request("/api/auth/logout", { method: "POST" });
    }
    clearSession();
  }

  return {
    token,
    isAuthenticated: Boolean(token),
    login,
    logout,
    api,
    clearSession,
  };
}
