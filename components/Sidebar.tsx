"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, statusDot } from "@/lib/utils";
import { MODELS } from "@/lib/types";
import type { TeamState, TeamConfig } from "@/lib/types";
import {
  Plus,
  Square,
  ChevronDown,
  ChevronRight,
  Bot,
  Eye,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface SidebarProps {
  teams: TeamState[];
  activeTeamId: string | null;
  selectedAgentFilter: string | null;
  onSelectTeam: (id: string) => void;
  onSelectAgentFilter: (agentName: string | null) => void;
  onCreateTeam: (config: TeamConfig) => void;
  onOpenWizard?: (templateIdx?: number) => void;
  onStopTeam: (id: string) => void;
  onSendTask: (teamId: string, task: string) => void;
}

export function Sidebar({
  teams,
  activeTeamId,
  selectedAgentFilter,
  onSelectTeam,
  onSelectAgentFilter,
  onCreateTeam,
  onOpenWizard,
  onStopTeam,
  onSendTask,
}: SidebarProps) {
  const [messageInput, setMessageInput] = useState("");
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  // Auto-expand active team
  useEffect(() => {
    if (activeTeamId) {
      setExpandedTeams((prev) => {
        if (prev.has(activeTeamId)) return prev;
        const next = new Set(prev);
        next.add(activeTeamId);
        return next;
      });
    }
  }, [activeTeamId]);

  const toggleExpand = (id: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const modelShort = (id?: string) => MODELS.find((m) => m.id === id)?.short ?? "Sonnet";

  return (
    <div className="flex h-full w-72 max-md:w-full max-md:absolute max-md:z-50 max-md:left-0 max-md:top-0 flex-col border-r border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span className="text-sm font-semibold">Maestro</span>
        </div>
        <div className="flex items-center gap-0.5">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenWizard?.()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        {/* Teams List - split into Active and History */}
        <div className="p-2">
          {teams.length === 0 && (
            <p className="px-2 py-4 text-xs text-muted-foreground text-center">
              Nenhum time criado.<br />Clique em + para comecar.
            </p>
          )}
          {teams.filter((t) => t.status === "running" || t.status === "creating").length > 0 && (
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Ativos</p>
          )}
          {teams.filter((t) => t.status !== "running" && t.status !== "creating").length > 0 &&
           teams.filter((t) => t.status === "running" || t.status === "creating").length === 0 && (
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Historico</p>
          )}
          {teams.map((team) => (
            <div key={team.id}>
              {/* Team row */}
              <button
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                  activeTeamId === team.id && "bg-accent"
                )}
                onClick={() => {
                  onSelectTeam(team.id);
                  onSelectAgentFilter(null); // Reset filter when switching teams
                  toggleExpand(team.id);
                }}
              >
                {expandedTeams.has(team.id) ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
                <div className={cn("h-2 w-2 rounded-full transition-colors", statusDot(team.status))} />
                <span className="flex-1 text-left truncate">{team.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {team.status === "stopped" && team.messages.length > 0 && (
                    <span className="text-[9px] text-muted-foreground">{team.messages.length} msgs</span>
                  )}
                  <Badge variant="outline" className="text-[10px] h-4 px-1">{team.agents.length}</Badge>
                </div>
              </button>

              {/* Agent list (expanded) */}
              {expandedTeams.has(team.id) && (
                <div className="ml-3 space-y-0.5 py-1">
                  {/* "All agents" option */}
                  <button
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors hover:bg-accent",
                      activeTeamId === team.id && !selectedAgentFilter && "bg-accent/60 text-foreground"
                    )}
                    onClick={() => {
                      onSelectTeam(team.id);
                      onSelectAgentFilter(null);
                    }}
                  >
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="flex-1 text-left">Todos os agentes</span>
                  </button>

                  {/* Individual agents with identity cards */}
                  {team.agents.map((agent, agentIdx) => {
                    const avatarColors = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-pink-500", "bg-cyan-500"];
                    const avatarColor = avatarColors[agentIdx % avatarColors.length];
                    const initial = agent.name.charAt(0).toUpperCase();
                    const isSelected = activeTeamId === team.id && selectedAgentFilter === agent.name;
                    const isWorking = agent.status === "working" || agent.status === "thinking";

                    return (
                      <button
                        key={agent.id}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-all hover:bg-accent group",
                          isSelected && "bg-primary/10 ring-1 ring-primary/20"
                        )}
                        onClick={() => {
                          onSelectTeam(team.id);
                          onSelectAgentFilter(isSelected ? null : agent.name);
                        }}
                      >
                        {/* Avatar with status ring */}
                        <div className="relative shrink-0">
                          <div className={cn(
                            "h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white",
                            avatarColor,
                            isWorking && "ring-2 ring-emerald-400 ring-offset-1 ring-offset-background"
                          )}>
                            {initial}
                          </div>
                          {isWorking && (
                            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 animate-pulse ring-1 ring-background" />
                          )}
                        </div>
                        {/* Name + role */}
                        <div className="flex-1 text-left min-w-0">
                          <span className="font-medium truncate block">{agent.name}</span>
                          <span className="text-[9px] text-muted-foreground truncate block">{agent.role?.substring(0, 30)}</span>
                        </div>
                        {/* Model badge */}
                        <Badge variant="secondary" className="text-[8px] h-3.5 px-1 font-normal shrink-0">
                          {modelShort(agent.model)}
                        </Badge>
                      </button>
                    );
                  })}

                  {team.status === "running" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-destructive hover:text-destructive/80 w-full justify-start pl-2 mt-1"
                      onClick={() => onStopTeam(team.id)}
                    >
                      <Square className="h-3 w-3 mr-1" /> Parar Time
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Message Input (for active team) */}
      {activeTeamId && (
        <>
          <Separator />
          <div className="p-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              {selectedAgentFilter
                ? `Mensagem para ${selectedAgentFilter}:`
                : "Mensagem ao time:"}
            </p>
            <Textarea
              placeholder={
                selectedAgentFilter
                  ? `Falar com ${selectedAgentFilter}...`
                  : "Digite uma mensagem para o time..."
              }
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="min-h-[50px] text-sm resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.metaKey) {
                  e.preventDefault();
                  if (messageInput.trim()) {
                    onSendTask(activeTeamId, messageInput.trim());
                    setMessageInput("");
                  }
                }
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">Cmd+Enter</p>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-xs"
                disabled={!messageInput.trim()}
                onClick={() => {
                  if (messageInput.trim()) {
                    onSendTask(activeTeamId, messageInput.trim());
                    setMessageInput("");
                  }
                }}
              >
                Enviar
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
