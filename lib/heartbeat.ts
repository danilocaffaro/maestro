/**
 * Heartbeat monitoring for agent processes.
 * Tracks last activity time per agent and detects stale/stuck agents.
 */

interface AgentHeartbeat {
  teamId: string;
  agentName: string;
  lastActivity: number;
  messageCount: number;
  status: "healthy" | "stale" | "dead";
  pid?: number;
}

const heartbeats = new Map<string, AgentHeartbeat>();
const STALE_THRESHOLD = 60_000;  // 60s without activity = stale
const DEAD_THRESHOLD = 300_000;  // 5min without activity = dead

/**
 * Record activity for an agent (called from cli-manager on each message)
 */
export function recordActivity(teamId: string, agentName: string, pid?: number) {
  const key = `${teamId}:${agentName}`;
  const existing = heartbeats.get(key);
  heartbeats.set(key, {
    teamId,
    agentName,
    lastActivity: Date.now(),
    messageCount: (existing?.messageCount || 0) + 1,
    status: "healthy",
    pid,
  });
}

/**
 * Mark agent as finished
 */
export function markFinished(teamId: string, agentName: string) {
  const key = `${teamId}:${agentName}`;
  heartbeats.delete(key);
}

/**
 * Get health status of all active agents
 */
export function getHealthStatus(): AgentHeartbeat[] {
  const now = Date.now();
  const result: AgentHeartbeat[] = [];

  for (const [key, hb] of heartbeats) {
    const age = now - hb.lastActivity;
    let status: AgentHeartbeat["status"] = "healthy";
    if (age > DEAD_THRESHOLD) status = "dead";
    else if (age > STALE_THRESHOLD) status = "stale";

    result.push({ ...hb, status });
  }

  return result;
}

/**
 * Get health for a specific team
 */
export function getTeamHealth(teamId: string): AgentHeartbeat[] {
  return getHealthStatus().filter((h) => h.teamId === teamId);
}

/**
 * Get count of agents by status
 */
export function getHealthSummary() {
  const all = getHealthStatus();
  return {
    total: all.length,
    healthy: all.filter((a) => a.status === "healthy").length,
    stale: all.filter((a) => a.status === "stale").length,
    dead: all.filter((a) => a.status === "dead").length,
  };
}
