"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import type { AgentMessage, PeerMessage, Task, Agent, TeamState } from "./types";

interface TeamStreamState {
  messages: AgentMessage[];
  peerMessages: PeerMessage[];
  tasks: Task[];
  agents: Agent[];
  connected: boolean;
  error: string | null;
}

export function useTeamStream(teamId: string | null) {
  const [state, setState] = useState<TeamStreamState>({
    messages: [],
    peerMessages: [],
    tasks: [],
    agents: [],
    connected: false,
    error: null,
  });
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!teamId) {
      setState({
        messages: [],
        peerMessages: [],
        tasks: [],
        agents: [],
        connected: false,
        error: null,
      });
      return;
    }

    // Step 1: Load existing state from backend (historical data)
    fetch(`/api/teams/${teamId}`)
      .then((r) => r.json())
      .then((team: TeamState) => {
        setState((s) => ({
          ...s,
          messages: team.messages || [],
          peerMessages: team.peerMessages || [],
          tasks: team.tasks || [],
          agents: team.agents || [],
        }));
      })
      .catch(() => {});

    // Step 2: Connect SSE for real-time updates
    const es = new EventSource(`/api/stream/${teamId}`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setState((s) => ({ ...s, connected: true, error: null }));
    };

    es.addEventListener("agent-message", (e) => {
      const msg: AgentMessage = JSON.parse(e.data);
      setState((s) => {
        // Avoid duplicates (message might already be in historical data)
        if (s.messages.some((m) => m.id === msg.id)) return s;
        return { ...s, messages: [...s.messages, msg] };
      });
    });

    es.addEventListener("peer-message", (e) => {
      const msg: PeerMessage = JSON.parse(e.data);
      setState((s) => {
        if (s.peerMessages.some((m) => m.id === msg.id)) return s;
        return { ...s, peerMessages: [...s.peerMessages, msg] };
      });
    });

    es.addEventListener("task-update", (e) => {
      const task: Task = JSON.parse(e.data);
      setState((s) => {
        const existing = s.tasks.findIndex((t) => t.id === task.id);
        const tasks = [...s.tasks];
        if (existing >= 0) tasks[existing] = task;
        else tasks.push(task);
        return { ...s, tasks };
      });
    });

    es.addEventListener("agent-status", (e) => {
      const agent: Agent = JSON.parse(e.data);
      // Notify on status changes
      if (agent.status === "done") {
        toast.success(`${agent.name} concluiu`, { duration: 3000 });
      } else if (agent.status === "error") {
        toast.error(`${agent.name} encontrou um erro`, { duration: 5000 });
      }
      setState((s) => {
        const existing = s.agents.findIndex((a) => a.id === agent.id);
        const agents = [...s.agents];
        if (existing >= 0) agents[existing] = agent;
        else agents.push(agent);
        return { ...s, agents };
      });
    });

    es.addEventListener("error", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data || "{}");
        setState((s) => ({ ...s, error: data.message || "Stream error" }));
      } catch {
        // SSE native error (no data), just mark disconnected
      }
    });

    es.onerror = () => {
      setState((s) => ({ ...s, connected: false }));
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [teamId]);

  const reset = useCallback(() => {
    setState({
      messages: [],
      peerMessages: [],
      tasks: [],
      agents: [],
      connected: false,
      error: null,
    });
  }, []);

  return { ...state, reset };
}
