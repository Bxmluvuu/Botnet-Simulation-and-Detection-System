import { useState } from "react";
import type { FormEvent } from "react";

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<unknown>;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("Checking credentials...");
    try {
      await onLogin(username, password);
      setPassword("");
      setStatus("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-6 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.1),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.08),transparent_26%)]" />
      <div className="relative w-full max-w-xl">
        <section className="glass-card fade-in-up relative overflow-hidden rounded-3xl p-7 sm:p-8">
          <div className="mb-8">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-lg text-emerald-300">
              C2
            </div>
            <h2 className="text-3xl font-semibold text-white">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Sign in to access the dashboard, security detections, and mitigation controls.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm text-slate-300">
              Username
              <input
                className="mt-2 w-full rounded-2xl border border-slate-700/70 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition duration-300 placeholder:text-slate-500 focus:border-emerald-400/70 focus:ring-4 focus:ring-emerald-500/10"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
              />
            </label>

            <label className="block text-sm text-slate-300">
              Password
              <input
                className="mt-2 w-full rounded-2xl border border-slate-700/70 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition duration-300 placeholder:text-slate-500 focus:border-emerald-400/70 focus:ring-4 focus:ring-emerald-500/10"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            <button
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-emerald-500 px-4 py-3 font-medium text-slate-950 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting && <span className="loading-dot h-4 w-4 rounded-full border-2 border-slate-950/30 border-t-slate-950" />}
              <span>{isSubmitting ? "Signing in..." : "Sign in"}</span>
            </button>
          </form>

          <div className="mt-5 min-h-6">
            {status && (
              <p
                className={`text-sm transition-all duration-300 ${
                  isSubmitting ? "text-sky-300" : status === "Checking credentials..." ? "text-sky-300" : "text-amber-300"
                }`}
              >
                {status}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
