import { execSync } from "child_process";

/**
 * Agent Registry - Auto-discovers and manages available AI agent CLIs.
 * Inspired by AionUI's unified multi-agent approach.
 *
 * Detects: Claude Code, OpenClaw, Codex, Goose AI, Aider, Cline, Continue, custom CLIs
 */

export interface AgentProvider {
  id: string;
  name: string;
  description: string;
  cli: string;            // CLI command name
  version: string | null;
  installed: boolean;
  icon: string;           // emoji or icon name
  color: string;          // tailwind color
  capabilities: string[];
  spawnArgs: (prompt: string) => string[];  // how to spawn with a prompt
}

// Known agent CLIs to scan for
const KNOWN_AGENTS: Omit<AgentProvider, "version" | "installed">[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    description: "Anthropic's autonomous coding agent with full tool access",
    cli: "claude",
    icon: "🤖",
    color: "bg-orange-500",
    capabilities: ["code", "files", "bash", "web", "mcp", "teams"],
    spawnArgs: (prompt) => ["-p", prompt, "--output-format", "stream-json", "--verbose", "--dangerously-skip-permissions"],
  },
  {
    id: "openclaw",
    name: "OpenClaw",
    description: "Open-source multi-agent framework with ACPX communication",
    cli: "openclaw",
    icon: "🦞",
    color: "bg-red-500",
    capabilities: ["code", "files", "agents", "acpx"],
    spawnArgs: (prompt) => ["run", "--prompt", prompt],
  },
  {
    id: "codex",
    name: "Codex CLI",
    description: "OpenAI's coding agent CLI",
    cli: "codex",
    icon: "🟢",
    color: "bg-green-500",
    capabilities: ["code", "files", "bash"],
    spawnArgs: (prompt) => ["--prompt", prompt],
  },
  {
    id: "goose",
    name: "Goose AI",
    description: "Block's autonomous developer agent",
    cli: "goose",
    icon: "🪿",
    color: "bg-yellow-500",
    capabilities: ["code", "files", "bash", "mcp"],
    spawnArgs: (prompt) => ["run", prompt],
  },
  {
    id: "aider",
    name: "Aider",
    description: "AI pair programming in your terminal",
    cli: "aider",
    icon: "🔧",
    color: "bg-blue-500",
    capabilities: ["code", "files", "git"],
    spawnArgs: (prompt) => ["--message", prompt, "--yes"],
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    description: "Run local LLMs - Llama, Mistral, Qwen, etc.",
    cli: "ollama",
    icon: "🦙",
    color: "bg-purple-500",
    capabilities: ["chat", "local"],
    spawnArgs: (prompt) => ["run", "llama3.3", prompt],
  },
  {
    id: "cline",
    name: "Cline",
    description: "Autonomous coding agent for VS Code",
    cli: "cline",
    icon: "⚡",
    color: "bg-cyan-500",
    capabilities: ["code", "files"],
    spawnArgs: (prompt) => ["--prompt", prompt],
  },
];

// Custom agents stored in SQLite (user-defined)
let customAgents: AgentProvider[] = [];

function checkInstalled(cli: string): { installed: boolean; version: string | null } {
  try {
    const which = execSync(`which ${cli} 2>/dev/null`, { encoding: "utf-8", timeout: 3000 }).trim();
    if (!which) return { installed: false, version: null };

    let version: string | null = null;
    try {
      version = execSync(`${cli} --version 2>/dev/null`, { encoding: "utf-8", timeout: 5000 }).trim().split("\n")[0];
    } catch {
      version = "installed";
    }
    return { installed: true, version };
  } catch {
    return { installed: false, version: null };
  }
}

/**
 * Scan system for all known agent CLIs
 */
export function discoverAgents(): AgentProvider[] {
  const discovered: AgentProvider[] = [];

  for (const agent of KNOWN_AGENTS) {
    const { installed, version } = checkInstalled(agent.cli);
    discovered.push({ ...agent, installed, version });
  }

  // Add custom agents
  for (const custom of customAgents) {
    const { installed, version } = checkInstalled(custom.cli);
    discovered.push({ ...custom, installed, version });
  }

  return discovered;
}

/**
 * Get only installed agents
 */
export function getInstalledAgents(): AgentProvider[] {
  return discoverAgents().filter((a) => a.installed);
}

/**
 * Get a specific agent provider by ID
 */
export function getAgentProvider(id: string): AgentProvider | null {
  return discoverAgents().find((a) => a.id === id) || null;
}

/**
 * Register a custom agent CLI
 */
export function registerCustomAgent(agent: Omit<AgentProvider, "installed" | "version">) {
  const { installed, version } = checkInstalled(agent.cli);
  customAgents.push({ ...agent, installed, version });
}

/**
 * Get spawn args for an agent provider
 */
export function getSpawnCommand(providerId: string, prompt: string): { cli: string; args: string[] } | null {
  const provider = getAgentProvider(providerId);
  if (!provider || !provider.installed) return null;
  return { cli: provider.cli, args: provider.spawnArgs(prompt) };
}
