import { spawn, ChildProcess } from "child_process";
import { eventBus } from "./event-bus";
import { maestroDB } from "./db";
import { generateId } from "./utils";
import type { TeamConfig, TeamState, Agent, AgentMessage, PeerMessage, Task } from "./types";
import { getSpawnCommand } from "./agent-registry";
import { ExecutionGraph } from "./execution-graph";
import { recordActivity, markFinished } from "./heartbeat";
import { relayDiscussion } from "./discussion-relay";
import { fireWebhook } from "./webhooks";
import path from "path";
import { writeFileSync, mkdirSync, appendFileSync } from "fs";

const activeProcesses = new Map<string, Map<string, ChildProcess>>();
const executionGraphs = new Map<string, ExecutionGraph>();
const teamConfigs = new Map<string, { config: TeamConfig & { id: string }; teamContext: string; sharedDir: string }>();

// ── Emit helpers (SSE + DB persist) ────────────────────────────────

function emitMsg(teamId: string, agent: string, content: string, type: AgentMessage["type"] = "text") {
  const msg: AgentMessage = { id: generateId(), agent, content, timestamp: Date.now(), type };
  eventBus.emitTeamEvent(teamId, { type: "agent-message", teamId, data: msg, timestamp: Date.now() });
  maestroDB.saveMessage(teamId, msg);
  recordActivity(teamId, agent);
}

function emitStatus(teamId: string, name: string, role: string, status: Agent["status"], model?: string) {
  const agent: Agent = { id: `${teamId}-${name}`, name, role, status, model: model as Agent["model"] };
  eventBus.emitTeamEvent(teamId, { type: "agent-status", teamId, data: agent, timestamp: Date.now() });
  maestroDB.updateAgentStatus(agent.id, status);
}

function emitPeer(teamId: string, from: string, to: string, content: string) {
  const msg: PeerMessage = { id: generateId(), from, to, content, timestamp: Date.now() };
  eventBus.emitTeamEvent(teamId, { type: "peer-message", teamId, data: msg, timestamp: Date.now() });
  maestroDB.savePeerMessage(teamId, msg);
}

function emitTask(teamId: string, task: Task) {
  eventBus.emitTeamEvent(teamId, { type: "task-update", teamId, data: task, timestamp: Date.now() });
  maestroDB.saveTask(teamId, task);
}

// ── Stream-JSON line parser (rich) ─────────────────────────────────

function processLine(teamId: string, agentName: string, line: string) {
  if (!line.trim()) return;
  try {
    const data = JSON.parse(line);

    // System init
    if (data.type === "system" && data.subtype === "init") {
      emitStatus(teamId, agentName, "", "working");
      return;
    }

    // Assistant message (main output)
    if (data.type === "assistant" && data.message) {
      for (const block of (data.message.content || [])) {
        // Thinking block (extended thinking / chain of thought)
        if (block.type === "thinking" && block.thinking) {
          emitMsg(teamId, agentName, block.thinking, "thinking" as AgentMessage["type"]);
          emitStatus(teamId, agentName, "", "thinking");
          continue;
        }

        if (block.type === "text" && block.text) {
          emitMsg(teamId, agentName, block.text);
          emitStatus(teamId, agentName, "", "working");

          // Relay discussion to other agents in the team
          const stored = teamConfigs.get(teamId);
          if (stored) {
            const allNames = stored.config.agents.map((a) => a.name);
            relayDiscussion(teamId, agentName, block.text, allNames);
          }
        }
        if (block.type === "tool_use") {
          const toolName = block.name || "tool";
          const input = block.input || {};

          // Detect file writes -> artifacts
          if (toolName === "Write" || toolName === "Edit") {
            const fp = input.file_path as string;
            if (fp) {
              maestroDB.saveArtifact(teamId, agentName, fp);
              emitPeer(teamId, agentName, "all", `Arquivo: ${path.basename(fp)}`);
            }
          }

          // Detect SendMessage -> P2P
          if (toolName === "SendMessage") {
            const to = (input.to as string) || "all";
            const msg = (input.message as string) || (input.summary as string) || "";
            emitPeer(teamId, agentName, to, msg);
          }

          // Detect TodoWrite -> tasks
          if (toolName === "TodoWrite" && Array.isArray(input.todos)) {
            for (const t of input.todos as Array<Record<string, string>>) {
              emitTask(teamId, {
                id: generateId(),
                content: t.content || t.activeForm || "",
                status: (t.status as Task["status"]) || "pending",
                assignee: agentName,
              });
            }
          }

          // Detect Bash commands
          if (toolName === "Bash") {
            const cmd = (input.command as string) || "";
            emitMsg(teamId, agentName, `$ ${cmd.substring(0, 200)}`, "tool_use");
            return;
          }

          emitMsg(teamId, agentName, `${toolName}: ${JSON.stringify(input).substring(0, 250)}`, "tool_use");
        }
      }
      return;
    }

    // Result (final) - extract cost/usage
    if (data.type === "result") {
      const usage = data.usage || {};
      const cost = data.total_cost_usd || 0;
      if (cost > 0 || usage.output_tokens) {
        maestroDB.saveCost(teamId, agentName, data.modelUsage ? Object.keys(data.modelUsage)[0] || "" : "", usage, cost);
      }
      return;
    }

    // Skip noise
    if (data.type === "rate_limit_event") return;
    if (data.role === "user") return; // tool results

  } catch {
    // Non-JSON: emit as raw text
    if (line.trim()) emitMsg(teamId, agentName, line);
  }
}

// ── Spawn agent (interactive mode with stdin) ──────────────────────

function spawnAgent(
  teamId: string,
  agentName: string,
  role: string,
  prompt: string,
  model?: string,
  providerId?: string,
  interactive: boolean = false,
): ChildProcess {
  emitStatus(teamId, agentName, role, "thinking", model);
  emitPeer(teamId, agentName, "all", `Iniciando: ${role}${providerId && providerId !== "claude-code" ? ` (${providerId})` : ""}`);

  // For -p mode: use "ignore" for stdin (no input needed)
  // For interactive mode: use "pipe" for stdin
  const stdinMode = interactive ? "pipe" : "ignore";

  // Determine CLI and args based on provider
  let cli = "claude";
  let args: string[];

  const providerCmd = providerId ? getSpawnCommand(providerId, prompt) : null;

  if (providerCmd) {
    // Use provider-specific CLI and args
    cli = providerCmd.cli;
    args = providerCmd.args;
  } else if (interactive) {
    args = ["--output-format", "stream-json", "--input-format", "stream-json", "--verbose", "--dangerously-skip-permissions"];
  } else {
    args = ["-p", prompt, "--output-format", "stream-json", "--verbose", "--dangerously-skip-permissions"];
  }

  const proc = spawn(cli, args, {
    env: { ...process.env, CLAUDECODE: "" },
    cwd: process.env.HOME || "/tmp",
    stdio: [stdinMode, "pipe", "pipe"],
  });

  // If interactive, send initial prompt via stdin
  if (interactive && proc.stdin) {
    const payload = JSON.stringify({
      type: "user",
      message: { role: "user", content: [{ type: "text", text: prompt }] },
    });
    proc.stdin.write(payload + "\n");
  }

  // Parse stdout line by line via data events
  let buffer = "";
  proc.stdout!.on("data", (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      processLine(teamId, agentName, line);
    }
  });

  proc.stderr!.on("data", () => { /* ignore stderr noise */ });

  proc.on("exit", (code) => {
    if (buffer.trim()) processLine(teamId, agentName, buffer);
    emitStatus(teamId, agentName, role, code === 0 ? "done" : "error", model);
    emitPeer(teamId, agentName, "all", code === 0 ? "Concluido." : `Erro (code ${code})`);
    markFinished(teamId, agentName);
    fireWebhook(code === 0 ? "agent.done" : "agent.error", { teamId, agent: agentName, exitCode: code });

    // P2P relay: append summary to shared context
    const msgs = maestroDB.getMessages(teamId).filter((m) => m.agent === agentName && m.type === "text");
    const lastMsg = msgs[msgs.length - 1]?.content || "";
    const summary = lastMsg.length > 500 ? lastMsg.substring(0, 500) + "..." : lastMsg;

    if (code === 0) {
      try {
        const stored = teamConfigs.get(teamId);
        if (stored) {
          const contextPath = path.join(stored.sharedDir, "TEAM_CONTEXT.md");
          appendFileSync(contextPath, `\n\n## ${agentName} (concluido)\n${summary}\n`);
        }
      } catch { /* ignore */ }
    }

    // Execution graph: mark done and spawn newly ready agents
    const graph = executionGraphs.get(teamId);
    if (graph) {
      graph.markDone(agentName);
      const readyAgents = graph.getReadyAgents();
      const procs = activeProcesses.get(teamId);
      const stored = teamConfigs.get(teamId);

      if (procs && stored) {
        for (const readyAgent of readyAgents) {
          graph.markRunning(readyAgent.name);

          // Build prompt with results from completed dependencies
          const depSummaries = (readyAgent.dependsOn || []).map((dep) => {
            const depMsgs = maestroDB.getMessages(teamId).filter((m) => m.agent === dep && m.type === "text");
            const depLast = depMsgs[depMsgs.length - 1]?.content || "";
            return `## Resultado de ${dep}:\n${depLast.substring(0, 800)}`;
          }).join("\n\n");

          const agentPrompt = `Voce e ${readyAgent.name}, ${readyAgent.role}.

## Seu Time
${stored.teamContext}

## Tarefa do Time
${stored.config.task}

${depSummaries ? `## Resultados dos agentes anteriores:\n${depSummaries}\n` : ""}
## Comunicacao
Shared context: ${path.join(stored.sharedDir, "TEAM_CONTEXT.md")}

## Instrucoes
- Faca sua parte considerando os resultados dos agentes anteriores.
- Seja conciso, direto e profundo.
- Trabalhe de forma autonoma e entregue resultado concreto.
`;

          const newProc = spawnAgent(teamId, readyAgent.name, readyAgent.role, agentPrompt, readyAgent.model, readyAgent.provider);
          procs.set(readyAgent.name, newProc);
        }
      }
    }

    checkAllDone(teamId);
  });

  proc.on("error", (err) => {
    emitMsg(teamId, agentName, `Spawn error: ${err.message}`);
    emitStatus(teamId, agentName, role, "error", model);
  });

  return proc;
}

function checkAllDone(teamId: string) {
  const procs = activeProcesses.get(teamId);
  if (!procs) return;

  // Check if any process is still running
  for (const [, proc] of procs) {
    if (proc.exitCode === null && !proc.killed) return; // still running
  }

  maestroDB.updateTeamStatus(teamId, "stopped");
  emitMsg(teamId, "System", "Todos os agentes finalizaram.");
  activeProcesses.delete(teamId);
}

// ── Public API ─────────────────────────────────────────────────────

export function spawnTeam(config: TeamConfig & { id: string }): TeamState {
  const teamId = config.id;

  const agents: Agent[] = config.agents.map((a) => ({
    id: `${teamId}-${a.name}`,
    name: a.name,
    role: a.role,
    model: a.model,
    status: "idle",
  }));

  const teamState: TeamState = {
    id: teamId,
    name: config.name,
    status: "running",
    agents,
    tasks: [],
    messages: [],
    peerMessages: [],
    createdAt: Date.now(),
  };

  // Persist to DB
  maestroDB.saveTeam(teamState, JSON.stringify(config));
  maestroDB.updateTeamStatus(teamId, "running");

  emitMsg(teamId, "System", `Time "${config.name}" iniciado com ${config.agents.length} agentes.`);

  const teamContext = config.agents.map((a) => `- **${a.name}**: ${a.role}`).join("\n");

  // Create shared context file that agents can read/write for P2P communication
  const sharedDir = path.join(process.env.HOME || "/tmp", ".maestro", "shared", teamId);
  mkdirSync(sharedDir, { recursive: true });
  const sharedContextPath = path.join(sharedDir, "TEAM_CONTEXT.md");
  writeFileSync(sharedContextPath, `# Team: ${config.name}
## Membros
${teamContext}

## Tarefa
${config.task}

## Notas Compartilhadas
(Agentes podem escrever aqui para compartilhar informacoes com o time)
`);

  const procs = new Map<string, ChildProcess>();
  activeProcesses.set(teamId, procs);

  // Store config for later use by execution graph
  teamConfigs.set(teamId, { config, teamContext, sharedDir });

  // Create execution graph
  const graph = new ExecutionGraph(config.agents, config.executionMode || "parallel");
  executionGraphs.set(teamId, graph);

  // Spawn initially ready agents (in parallel mode: all; in sequential: first; in graph: those with no deps)
  const readyAgents = graph.getReadyAgents();

  for (const agentConfig of readyAgents) {
    graph.markRunning(agentConfig.name);
    const agentPrompt = `Voce e ${agentConfig.name}, ${agentConfig.role}.

## Seu Time
${teamContext}

## Tarefa do Time
${config.task}

## Comunicacao com o Time
Para compartilhar informacoes com outros agentes do time, escreva no arquivo:
${sharedContextPath}
Para ver o que outros agentes compartilharam, leia esse arquivo.

## Instrucoes
- Faca sua parte da tarefa de acordo com seu papel.
- Seja conciso, direto e profundo.
- Se precisar criar arquivos, crie-os.
- Trabalhe de forma autonoma e entregue resultado concreto.
- Ao terminar, adicione um resumo do seu trabalho no TEAM_CONTEXT.md
`;

    const proc = spawnAgent(teamId, agentConfig.name, agentConfig.role, agentPrompt, agentConfig.model, agentConfig.provider);
    procs.set(agentConfig.name, proc);
  }

  return teamState;
}

export function stopTeam(teamId: string) {
  const procs = activeProcesses.get(teamId);
  if (procs) {
    for (const [, p] of procs) p.kill("SIGTERM");
    activeProcesses.delete(teamId);
  }
  maestroDB.updateTeamStatus(teamId, "stopped");
}

export function sendMessage(teamId: string, message: string, targetAgent?: string) {
  emitMsg(teamId, "Voce", message);

  let procs = activeProcesses.get(teamId);

  // If no active processes, spawn a new interactive agent to handle the message
  if (!procs || procs.size === 0) {
    const team = maestroDB.getTeam(teamId);
    if (!team) {
      emitMsg(teamId, "System", "Time nao encontrado.");
      return;
    }

    // Determine target: specific agent or first agent
    const agentName = targetAgent || team.agents[0]?.name || "Assistant";
    const agent = team.agents.find((a) => a.name === agentName) || team.agents[0];
    if (!agent) return;

    // Spawn new interactive process
    procs = new Map();
    activeProcesses.set(teamId, procs);
    maestroDB.updateTeamStatus(teamId, "running");

    const contextPrompt = `Voce e ${agent.name}, ${agent.role}. O usuario esta enviando uma mensagem de follow-up.

Contexto: voce faz parte do time "${team.name}". Responda a mensagem do usuario.

Mensagem: ${message}`;

    const proc = spawnAgent(teamId, agent.name, agent.role, contextPrompt, agent.model);
    procs.set(agent.name, proc);
    emitPeer(teamId, "Voce", agent.name, message);
    return;
  }

  // Send to running processes
  const targets = targetAgent ? [targetAgent] : Array.from(procs.keys());
  for (const name of targets) {
    const proc = procs.get(name);
    if (proc?.stdin?.writable) {
      const payload = JSON.stringify({
        type: "user",
        message: { role: "user", content: [{ type: "text", text: message }] },
      });
      proc.stdin.write(payload + "\n");
      emitPeer(teamId, "Voce", name, message);
    } else {
      // Agent finished, spawn new one
      const team = maestroDB.getTeam(teamId);
      const agent = team?.agents.find((a) => a.name === name);
      if (agent) {
        const contextPrompt = `Voce e ${agent.name}, ${agent.role}. Follow-up do usuario: ${message}`;
        const newProc = spawnAgent(teamId, agent.name, agent.role, contextPrompt, agent.model);
        procs.set(name, newProc);
        maestroDB.updateTeamStatus(teamId, "running");
      }
      emitPeer(teamId, "Voce", name, message);
    }
  }
}

export function getTeamState(teamId: string): TeamState | null {
  return maestroDB.getTeam(teamId);
}

export function listTeams(): TeamState[] {
  return maestroDB.listTeams();
}

export function getArtifacts(teamId: string) {
  return maestroDB.getArtifacts(teamId);
}
