import { useState } from "react";
import { API_BASE } from "./services/apiClient";
import { useAuth } from "./hooks/useAuth";
import { useDashboardData } from "./hooks/useDashboardData";
import { useMetasploit } from "./hooks/useMetasploit";
import { useSnortData } from "./hooks/useSnortData";
import { LoginForm } from "./components/LoginForm";
import { DashboardHeader } from "./components/DashboardHeader";
import { ScheduleJobForm } from "./components/ScheduleJobForm";
import { AgentsTable } from "./components/AgentsTable";
import { JobsTable } from "./components/JobsTable";
import { SecurityOverviewCards } from "./components/SecurityOverviewCards";
import { SessionsPage } from "./components/SessionsPage";
import { SessionsPanel } from "./components/SessionsPanel";
import { DetectPanel } from "./components/DetectPanel";
import { PreventPanel } from "./components/PreventPanel";
import { MetasploitPage } from "./components/MetasploitPage";
import { SnortPage } from "./components/SnortPage";

type ViewType = "overview" | "sessions" | "metasploit" | "snort";

function App() {
  const { isAuthenticated, login, logout, api } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>("overview");
  const { agents, jobs, status, onlineCount, securitySummary, scheduleJob, updateMitigation, deleteJob, unblockIp, unblockAll } = useDashboardData(
    api,
    isAuthenticated
  );
  const msf = useMetasploit(api, isAuthenticated);
  const snort = useSnortData(api, isAuthenticated);

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(16,185,129,0.16),transparent_22%),radial-gradient(circle_at_88%_6%,rgba(59,130,246,0.16),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(168,85,247,0.12),transparent_28%)]" />
      <div className="relative mx-auto max-w-7xl p-6 lg:p-8">
        <DashboardHeader
          apiBase={API_BASE}
          activeView={activeView}
          onlineCount={onlineCount}
          onChangeView={setActiveView}
          totalAgents={agents.length}
          onLogout={logout}
          msfConnected={msf.status.connected}
          snortConnected={snort.health.connected}
        />
        {activeView === "overview" ? (
          <>
            <SecurityOverviewCards summary={securitySummary} />
            <SessionsPanel agents={agents} jobs={jobs} msfSessions={msf.sessions} onOpenSessions={() => setActiveView("sessions")} />
            <section className="mb-6 grid gap-4 lg:grid-cols-2">
              <DetectPanel summary={securitySummary} />
              <PreventPanel api={api} onUpdate={updateMitigation} summary={securitySummary} onUnblockIp={unblockIp} onUnblockAll={unblockAll} />
            </section>
            <ScheduleJobForm msfSessions={msf.sessions} status={status} onSchedule={scheduleJob} />
            <AgentsTable msfSessions={msf.sessions} />
            <JobsTable jobs={jobs} onDeleteJob={deleteJob} />
          </>
        ) : activeView === "sessions" ? (
          <SessionsPage agents={agents} jobs={jobs} summary={securitySummary} api={api} isAuthenticated={isAuthenticated} />
        ) : activeView === "metasploit" ? (
          <MetasploitPage
            status={msf.status}
            sessions={msf.sessions}
            consoleId={msf.consoleId}
            consoleOutput={msf.consoleOutput}
            consolePrompt={msf.consolePrompt}
            consoleBusy={msf.consoleBusy}
            loading={msf.loading}
            error={msf.error}
            onConnect={msf.connect}
            onDisconnect={msf.disconnect}
            onCreateConsole={msf.createConsole}
            onDestroyConsole={msf.destroyConsole}
            onWriteConsole={msf.writeConsole}
          />
        ) : (
          <SnortPage
            health={snort.health}
            alerts={snort.alerts}
            stats={snort.stats}
          />
        )}
      </div>
    </main>
  );
}

export default App;
