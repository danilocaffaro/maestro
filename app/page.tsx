"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
// Layout uses CSS flex instead of react-resizable-panels for dynamic right panel
import { Sidebar } from "@/components/Sidebar";
import { LiveOutput } from "@/components/LiveOutput";
import { MessageFeed } from "@/components/MessageFeed";
import { TaskList } from "@/components/TaskList";
import { AgentFlowDiagram } from "@/components/AgentFlowDiagram";
import { ArtifactExplorer } from "@/components/ArtifactExplorer";
import { CostBadge } from "@/components/CostBadge";
import { CostDashboard } from "@/components/CostDashboard";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { TeamWizard } from "@/components/wizard/TeamWizard";
import { RaceView } from "@/components/RaceView";
import { ApprovalBanner } from "@/components/ApprovalBanner";
import { LoginScreen } from "@/components/LoginScreen";
import { useTeamStream } from "@/lib/stream-client";
import { useAuth } from "@/lib/use-auth";
import type { TeamState, TeamConfig, AgentMessage } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Activity, FileText, ListTodo, MessagesSquare, Filter, X, Zap, DollarSign, BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Filter chip types for the unified timeline
type FilterType = "all" | "text" | "tool" | "p2p" | "task" | "artifact";

const FILTER_OPTIONS: { id: FilterType; label: string; icon: typeof Activity }[] = [
  { id: "all", label: "Tudo", icon: Activity },
  { id: "text", label: "Texto", icon: Activity },
  { id: "tool", label: "Tools", icon: Activity },
  { id: "p2p", label: "P2P", icon: MessagesSquare },
  { id: "task", label: "Tasks", icon: ListTodo },
  { id: "artifact", label: "Artifacts", icon: FileText },
];

export default function Home() {
  const { authenticated, login } = useAuth();
  const [teams, setTeams] = useState<TeamState[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<FilterType>>(new Set(["all"]));
  const [rightPanel, setRightPanel] = useState<"artifacts" | "tasks" | "race" | "costs" | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardTemplate, setWizardTemplate] = useState<number | undefined>();

  useEffect(() => {
    const loadTeams = () => {
      fetch("/api/teams").then((r) => r.json()).then((data: TeamState[]) => {
        if (data.length > 0) { setTeams(data); setActiveTeamId((prev) => prev ?? data[0].id); }
      }).catch(() => {});
    };
    loadTeams();
    const interval = setInterval(loadTeams, 5000);
    return () => clearInterval(interval);
  }, []);

  const stream = useTeamStream(activeTeamId);
  const activeTeam = teams.find((t) => t.id === activeTeamId);

  const workingAgents = useMemo(() =>
    stream.agents.filter((a) => a.status === "working" || a.status === "thinking").map((a) => a.name),
  [stream.agents]);

  const displayAgents = useMemo(() => {
    const teamAgents = activeTeam?.agents || [];
    if (stream.agents.length === 0) return teamAgents;
    return teamAgents.map((ta) => {
      const sa = stream.agents.find((a) => a.name === ta.name);
      return sa ? { ...ta, status: sa.status } : ta;
    });
  }, [stream.agents, activeTeam]);

  // Unified timeline: merge all events into single chronological feed
  const timeline = useMemo(() => {
    let msgs = stream.messages;

    // Agent filter
    if (selectedAgentFilter) {
      msgs = msgs.filter((m) => m.agent === selectedAgentFilter || m.agent === "System" || m.agent === "Voce");
    }

    // Type filters
    if (!activeFilters.has("all")) {
      msgs = msgs.filter((m) => {
        if (activeFilters.has("text") && m.type === "text") return true;
        if (activeFilters.has("tool") && (m.type === "tool_use" || m.type === "tool_result")) return true;
        return false;
      });
    }

    return msgs;
  }, [stream.messages, selectedAgentFilter, activeFilters]);

  const toggleFilter = (f: FilterType) => {
    setActiveFilters((prev) => {
      if (f === "all") return new Set(["all"]);
      const next = new Set(prev);
      next.delete("all");
      if (next.has(f)) next.delete(f);
      else next.add(f);
      if (next.size === 0) return new Set(["all"]);
      return next;
    });
  };

  const handleCreateTeam = useCallback(async (config: TeamConfig) => {
    const teamId = generateId();
    const newTeam: TeamState = {
      id: teamId, name: config.name, status: "creating",
      agents: config.agents.map((a) => ({ id: `${teamId}-${a.name}`, name: a.name, role: a.role, model: a.model, status: "idle" })),
      tasks: [], messages: [], peerMessages: [], createdAt: Date.now(),
    };
    setTeams((prev) => [...prev, newTeam]);
    setActiveTeamId(teamId);
    setSelectedAgentFilter(null);
    setRightPanel(null);
    try {
      const res = await fetch("/api/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...config, id: teamId }) });
      if (!res.ok) throw new Error((await res.json()).error || "Erro");
      setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, status: "running" } : t)));
      toast.success(`Time "${config.name}" criado!`);
    } catch (err) {
      setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, status: "error", error: (err as Error).message } : t)));
      toast.error(`Erro: ${(err as Error).message}`);
    }
  }, []);

  const handleStopTeam = useCallback(async (teamId: string) => {
    try {
      await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
      setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, status: "stopped" } : t)));
      toast.info("Time parado.");
    } catch { toast.error("Erro ao parar time."); }
  }, []);

  const handleSendTask = useCallback(async (teamId: string, message: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/message`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
      if (!res.ok) throw new Error((await res.json()).error || "Erro");
    } catch (err) { toast.error(`Erro: ${(err as Error).message}`); }
  }, []);

  const hasTeams = teams.length > 0;

  const openWizard = useCallback((templateIdx?: number) => {
    setWizardTemplate(templateIdx);
    setWizardOpen(true);
  }, []);

  // Auth guard
  if (authenticated === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm">Verificando acesso...</span>
        </div>
      </div>
    );
  }
  if (authenticated === false) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <TeamWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onComplete={(config) => { setWizardOpen(false); handleCreateTeam(config); }}
        initialTemplateIdx={wizardTemplate}
      />

      <Sidebar
        teams={teams}
        activeTeamId={activeTeamId}
        selectedAgentFilter={selectedAgentFilter}
        onSelectTeam={setActiveTeamId}
        onSelectAgentFilter={setSelectedAgentFilter}
        onCreateTeam={handleCreateTeam}
        onOpenWizard={openWizard}
        onStopTeam={handleStopTeam}
        onSendTask={handleSendTask}
      />

      {!hasTeams ? (
        <main className="flex flex-1 flex-col overflow-hidden">
          <WelcomeScreen onOpenCreate={() => openWizard()} />
        </main>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Main Panel: Diagram + Timeline */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
              {/* Diagram area */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: displayAgents.length > 0 ? 180 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="border-b border-border shrink-0 overflow-hidden glass-panel"
              >
                <div style={{ width: "100%", height: "180px" }}>
                  <AgentFlowDiagram agents={displayAgents} peerMessages={stream.peerMessages} selectedAgent={selectedAgentFilter} onSelectAgent={setSelectedAgentFilter} />
                </div>
              </motion.div>

              {/* Approval banner (HITL) */}
              <ApprovalBanner teamId={activeTeamId} />

              {/* Filter bar */}
              <div className="flex items-center gap-2 border-b border-border px-3 py-1.5 bg-card/50 shrink-0">
                <Filter className="h-3 w-3 text-muted-foreground shrink-0" />
                <div className="flex gap-1 flex-1 overflow-x-auto">
                  {FILTER_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => toggleFilter(f.id)}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors border whitespace-nowrap ${
                        activeFilters.has(f.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "text-muted-foreground border-transparent hover:bg-accent"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {selectedAgentFilter && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20 shrink-0"
                    onClick={() => setSelectedAgentFilter(null)}
                  >
                    {selectedAgentFilter} <X className="h-2.5 w-2.5" />
                  </motion.button>
                )}

                {/* Right panel toggles */}
                <div className="flex gap-0.5 ml-auto shrink-0">
                  <button
                    onClick={() => setRightPanel(rightPanel === "artifacts" ? null : "artifacts")}
                    className={`rounded p-1 transition-colors ${rightPanel === "artifacts" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"}`}
                    title="Artifacts"
                  >
                    <FileText className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setRightPanel(rightPanel === "tasks" ? null : "tasks")}
                    className={`rounded p-1 transition-colors ${rightPanel === "tasks" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"}`}
                    title="Tasks"
                  >
                    <ListTodo className="h-3.5 w-3.5" />
                  </button>
                  <Separator orientation="vertical" className="h-4 mx-0.5" />
                  <button
                    onClick={() => setRightPanel(rightPanel === "race" ? null : "race")}
                    className={`rounded p-1 transition-colors ${rightPanel === "race" ? "bg-amber-500/20 text-amber-500" : "text-muted-foreground hover:bg-accent"}`}
                    title="Race Mode"
                  >
                    <Zap className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setRightPanel(rightPanel === "costs" ? null : "costs")}
                    className={`rounded p-1 transition-colors ${rightPanel === "costs" ? "bg-emerald-500/20 text-emerald-500" : "text-muted-foreground hover:bg-accent"}`}
                    title="Custos"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Unified Timeline */}
              <div className="flex-1 min-h-0">
                <LiveOutput messages={timeline} showTypingFor={workingAgents} />
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between border-t border-border bg-card px-3 py-1 text-[10px] text-muted-foreground shrink-0">
                <div className="flex items-center gap-3">
                  {stream.connected ? (
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Conectado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" /> Desconectado
                    </span>
                  )}
                  {activeTeam && <span>{activeTeam.name}</span>}
                  {workingAgents.length > 0 && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 text-emerald-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {workingAgents.join(", ")}
                    </motion.span>
                  )}
                  {stream.peerMessages.length > 0 && (
                    <span className="flex items-center gap-1">
                      <MessagesSquare className="h-3 w-3" /> {stream.peerMessages.length} P2P
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <CostBadge teamId={activeTeamId} />
                  <span>Maestro v0.5</span>
                </div>
              </div>
          </div>

          {/* Right Panel: Artifacts, Tasks, or Race */}
          {rightPanel && (
            <div className="w-[380px] shrink-0 border-l border-border bg-card flex flex-col h-full transition-all duration-200">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
                <span className="text-xs font-medium flex items-center gap-1.5">
                  {rightPanel === "artifacts" && <><FileText className="h-3.5 w-3.5 text-primary" /> Artifacts</>}
                  {rightPanel === "tasks" && <><ListTodo className="h-3.5 w-3.5 text-primary" /> Tasks</>}
                  {rightPanel === "race" && <><Zap className="h-3.5 w-3.5 text-amber-500" /> Race Mode</>}
                  {rightPanel === "costs" && <><BarChart3 className="h-3.5 w-3.5 text-emerald-500" /> Custos</>}
                </span>
                <button onClick={() => setRightPanel(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                {rightPanel === "artifacts" && <ArtifactExplorer teamId={activeTeamId} />}
                {rightPanel === "tasks" && <TaskList tasks={stream.tasks} />}
                {rightPanel === "race" && <RaceView onClose={() => setRightPanel(null)} />}
                {rightPanel === "costs" && <CostDashboard teamId={activeTeamId} />}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
