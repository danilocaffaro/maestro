export type AgentStatus = "idle" | "working" | "thinking" | "error" | "done";

export type ModelId = "claude-sonnet-4-6" | "claude-opus-4-6" | "claude-haiku-4-5";

export const MODELS: { id: ModelId; label: string; short: string }[] = [
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6", short: "Sonnet" },
  { id: "claude-opus-4-6", label: "Opus 4.6", short: "Opus" },
  { id: "claude-haiku-4-5", label: "Haiku 4.5", short: "Haiku" },
];

export interface AgentConfig {
  name: string;
  role: string;
  model?: ModelId;
  provider?: string;
  dependsOn?: string[];  // agent names this agent waits for before starting
  systemPrompt?: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  model?: ModelId;
}

export type TaskStage = "inbox" | "assigned" | "in_progress" | "testing" | "review" | "done";

export const TASK_STAGES: { id: TaskStage; label: string; color: string }[] = [
  { id: "inbox", label: "Inbox", color: "bg-zinc-400" },
  { id: "assigned", label: "Atribuido", color: "bg-blue-400" },
  { id: "in_progress", label: "Em Progresso", color: "bg-amber-400" },
  { id: "testing", label: "Testando", color: "bg-purple-400" },
  { id: "review", label: "Review", color: "bg-cyan-400" },
  { id: "done", label: "Concluido", color: "bg-emerald-400" },
];

export interface Task {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed"; // legacy compat
  stage?: TaskStage;
  assignee?: string;
  priority?: "low" | "medium" | "high";
}

export interface PeerMessage {
  id: string;
  from: string;
  to: string | "all";
  content: string;
  timestamp: number;
}

export interface AgentMessage {
  id: string;
  agent: string;
  content: string;
  timestamp: number;
  type: "text" | "tool_use" | "tool_result" | "thinking";
}

export interface TeamConfig {
  name: string;
  agents: AgentConfig[];
  task: string;
  model?: string;
  maxBudget?: number;
  timeout?: number;
  executionMode?: "parallel" | "sequential" | "graph";
}

export interface TeamState {
  id: string;
  name: string;
  status: "creating" | "running" | "paused" | "stopped" | "error";
  agents: Agent[];
  tasks: Task[];
  messages: AgentMessage[];
  peerMessages: PeerMessage[];
  createdAt: number;
  error?: string;
}

// Race mode: compare variants side-by-side
export interface RaceVariant {
  id: string;
  label: string;
  model: ModelId;
  teamId: string; // each variant is a team
}

export interface Race {
  id: string;
  prompt: string;
  variants: RaceVariant[];
  status: "running" | "completed";
  createdAt: number;
  winnerId?: string;
}

export type StreamEventType =
  | "agent-message"
  | "task-update"
  | "peer-message"
  | "agent-status"
  | "team-status"
  | "error";

export interface StreamEvent {
  type: StreamEventType;
  teamId: string;
  data: AgentMessage | Task | PeerMessage | Agent | TeamState | { message: string };
  timestamp: number;
}
