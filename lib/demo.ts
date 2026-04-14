/**
 * @module demo
 * @description Demonstrates agent orchestration utilities for coordinating
 * multiple AI agents working in parallel on decomposed tasks.
 */

/**
 * Represents an individual agent in the orchestration team.
 */
export interface Agent {
  /** Unique identifier for the agent */
  id: string;
  /** Human-readable role name (e.g., "Coder", "Writer") */
  role: string;
  /** Current execution status */
  status: "idle" | "running" | "done" | "failed";
}

/**
 * Result produced by a single agent after completing its task.
 */
export interface AgentResult<T = unknown> {
  agentId: string;
  role: string;
  output: T;
  durationMs: number;
  error?: string;
}

/**
 * Options controlling how the orchestrator runs the team.
 */
export interface OrchestrationOptions {
  /**
   * Maximum time in milliseconds to wait for all agents to complete.
   * @default 30_000
   */
  timeoutMs?: number;
  /**
   * Whether to continue collecting results when one agent fails.
   * @default false
   */
  continueOnFailure?: boolean;
  /**
   * Shared context file path for inter-agent communication.
   */
  sharedContextPath?: string;
}

/**
 * Summary returned after the full team run completes.
 */
export interface OrchestrationSummary<T = unknown> {
  totalAgents: number;
  succeeded: number;
  failed: number;
  totalDurationMs: number;
  results: AgentResult<T>[];
}

/**
 * Simulates running a single agent task with a configurable async workload.
 *
 * @param agent - The agent to execute.
 * @param task  - An async function representing the agent's work. Receives the
 *               agent object and must return a typed output value.
 * @returns A resolved {@link AgentResult} with timing information, or a failed
 *          result if `task` throws.
 *
 * @example
 * ```ts
 * const result = await runAgent(
 *   { id: "c1", role: "Coder", status: "idle" },
 *   async (agent) => {
 *     // ... write files, call APIs, etc.
 *     return { linesWritten: 42 };
 *   }
 * );
 * console.log(result.output); // { linesWritten: 42 }
 * ```
 */
export async function runAgent<T>(
  agent: Agent,
  task: (agent: Agent) => Promise<T>
): Promise<AgentResult<T>> {
  const start = Date.now();
  agent.status = "running";

  try {
    const output = await task(agent);
    agent.status = "done";
    return {
      agentId: agent.id,
      role: agent.role,
      output,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    agent.status = "failed";
    return {
      agentId: agent.id,
      role: agent.role,
      output: undefined as T,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Orchestrates a team of agents, running all tasks in parallel and collecting
 * their results.
 *
 * Tasks are dispatched concurrently via `Promise.allSettled`, so a single
 * failure does not block other agents (when `continueOnFailure` is `true`).
 *
 * @param agents  - Array of agents to include in this run.
 * @param tasks   - Map from `agent.id` to the async task function for that agent.
 * @param options - Optional orchestration settings.
 * @returns An {@link OrchestrationSummary} with per-agent results and aggregate stats.
 *
 * @throws {Error} When the overall run exceeds `options.timeoutMs`.
 *
 * @example
 * ```ts
 * const team: Agent[] = [
 *   { id: "writer", role: "Writer", status: "idle" },
 *   { id: "coder",  role: "Coder",  status: "idle" },
 * ];
 *
 * const summary = await orchestrateTeam(team, {
 *   writer: async () => ({ file: "DEMO_OUTPUT.md", words: 320 }),
 *   coder:  async () => ({ file: "lib/demo.ts",   lines: 180 }),
 * });
 *
 * console.table(summary.results.map((r) => ({ role: r.role, ...r.output })));
 * // ┌─────────┬────────────────────┬───────┐
 * // │  role   │        file        │ words │
 * // ├─────────┼────────────────────┼───────┤
 * // │ Writer  │ DEMO_OUTPUT.md     │  320  │
 * // │ Coder   │ lib/demo.ts        │       │
 * // └─────────┴────────────────────┴───────┘
 * ```
 */
export async function orchestrateTeam<T>(
  agents: Agent[],
  tasks: Record<string, (agent: Agent) => Promise<T>>,
  options: OrchestrationOptions = {}
): Promise<OrchestrationSummary<T>> {
  const { timeoutMs = 30_000, continueOnFailure = false } = options;
  const start = Date.now();

  const runWithTimeout = <R>(p: Promise<R>): Promise<R> =>
    Promise.race([
      p,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Orchestration timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);

  const promises = agents.map((agent) => {
    const task = tasks[agent.id];
    if (!task) {
      return Promise.resolve<AgentResult<T>>({
        agentId: agent.id,
        role: agent.role,
        output: undefined as T,
        durationMs: 0,
        error: `No task registered for agent "${agent.id}"`,
      });
    }
    return runWithTimeout(runAgent(agent, task));
  });

  const settled = continueOnFailure
    ? await Promise.allSettled(promises).then((results) =>
        results.map((r) =>
          r.status === "fulfilled"
            ? r.value
            : ({
                agentId: "unknown",
                role: "unknown",
                output: undefined as T,
                durationMs: 0,
                error: r.reason instanceof Error ? r.reason.message : String(r.reason),
              } satisfies AgentResult<T>)
        )
      )
    : await Promise.all(promises);

  const succeeded = settled.filter((r) => !r.error).length;

  return {
    totalAgents: agents.length,
    succeeded,
    failed: agents.length - succeeded,
    totalDurationMs: Date.now() - start,
    results: settled,
  };
}
