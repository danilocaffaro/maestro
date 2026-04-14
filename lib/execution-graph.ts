import type { AgentConfig } from "./types";

/**
 * Execution graph for agent dependency management.
 * Supports parallel (default), sequential, and graph-based execution.
 */

export type ExecutionMode = "parallel" | "sequential" | "graph";

interface GraphNode {
  agent: AgentConfig;
  dependsOn: string[];  // agent names this depends on
  status: "pending" | "running" | "done" | "error";
}

export class ExecutionGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private mode: ExecutionMode;

  constructor(agents: AgentConfig[], mode: ExecutionMode = "parallel") {
    this.mode = mode;

    if (mode === "sequential") {
      // Sequential: each agent depends on the previous
      agents.forEach((agent, i) => {
        this.nodes.set(agent.name, {
          agent,
          dependsOn: i > 0 ? [agents[i - 1].name] : [],
          status: "pending",
        });
      });
    } else if (mode === "graph") {
      // Graph: use explicit dependsOn from agent config
      agents.forEach((agent) => {
        this.nodes.set(agent.name, {
          agent,
          dependsOn: agent.dependsOn || [],
          status: "pending",
        });
      });
    } else {
      // Parallel: no dependencies
      agents.forEach((agent) => {
        this.nodes.set(agent.name, {
          agent,
          dependsOn: [],
          status: "pending",
        });
      });
    }
  }

  /**
   * Get agents that are ready to run (all dependencies satisfied)
   */
  getReadyAgents(): AgentConfig[] {
    const ready: AgentConfig[] = [];
    for (const [, node] of this.nodes) {
      if (node.status !== "pending") continue;

      const allDepsDone = node.dependsOn.every((dep) => {
        const depNode = this.nodes.get(dep);
        return depNode?.status === "done";
      });

      if (allDepsDone) {
        ready.push(node.agent);
      }
    }
    return ready;
  }

  /**
   * Mark an agent as running
   */
  markRunning(name: string) {
    const node = this.nodes.get(name);
    if (node) node.status = "running";
  }

  /**
   * Mark an agent as completed
   */
  markDone(name: string) {
    const node = this.nodes.get(name);
    if (node) node.status = "done";
  }

  /**
   * Mark an agent as errored
   */
  markError(name: string) {
    const node = this.nodes.get(name);
    if (node) node.status = "error";
  }

  /**
   * Check if all agents are finished (done or error)
   */
  isComplete(): boolean {
    for (const [, node] of this.nodes) {
      if (node.status === "pending" || node.status === "running") return false;
    }
    return true;
  }

  /**
   * Get agent names that have completed
   */
  getCompletedAgents(): string[] {
    return Array.from(this.nodes.entries())
      .filter(([, n]) => n.status === "done")
      .map(([name]) => name);
  }
}
