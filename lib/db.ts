import Database from "better-sqlite3";
import path from "path";
import type { TeamState, AgentMessage, PeerMessage, Task, Agent } from "./types";

const DB_PATH = path.join(process.env.HOME || "/tmp", ".maestro", "maestro.db");

// Ensure directory exists
import { mkdirSync } from "fs";
mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'creating',
    config TEXT, -- JSON of TeamConfig
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    model TEXT DEFAULT 'claude-sonnet-4-6',
    status TEXT NOT NULL DEFAULT 'idle',
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    agent TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS peer_messages (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    from_agent TEXT NOT NULL,
    to_agent TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    assignee TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS cost_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id TEXT NOT NULL,
    agent TEXT NOT NULL,
    model TEXT,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cache_read_tokens INTEGER DEFAULT 0,
    cache_creation_tokens INTEGER DEFAULT 0,
    cost_usd REAL DEFAULT 0,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_cost_team ON cost_tracking(team_id);

  CREATE TABLE IF NOT EXISTS artifacts (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    agent TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_messages_team ON messages(team_id);
  CREATE INDEX IF NOT EXISTS idx_peer_messages_team ON peer_messages(team_id);
  CREATE INDEX IF NOT EXISTS idx_agents_team ON agents(team_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_team ON tasks(team_id);
  CREATE INDEX IF NOT EXISTS idx_artifacts_team ON artifacts(team_id);
`);

// Prepared statements
const stmts = {
  insertTeam: db.prepare(`INSERT OR REPLACE INTO teams (id, name, status, config, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`),
  updateTeamStatus: db.prepare(`UPDATE teams SET status = ?, updated_at = ? WHERE id = ?`),
  getTeam: db.prepare(`SELECT * FROM teams WHERE id = ?`),
  listTeams: db.prepare(`SELECT * FROM teams ORDER BY created_at DESC`),
  deleteTeam: db.prepare(`DELETE FROM teams WHERE id = ?`),

  insertAgent: db.prepare(`INSERT OR REPLACE INTO agents (id, team_id, name, role, model, status) VALUES (?, ?, ?, ?, ?, ?)`),
  updateAgentStatus: db.prepare(`UPDATE agents SET status = ? WHERE id = ?`),
  getAgentsByTeam: db.prepare(`SELECT * FROM agents WHERE team_id = ?`),

  insertMessage: db.prepare(`INSERT INTO messages (id, team_id, agent, content, type, timestamp) VALUES (?, ?, ?, ?, ?, ?)`),
  getMessagesByTeam: db.prepare(`SELECT * FROM messages WHERE team_id = ? ORDER BY timestamp ASC`),

  insertPeerMessage: db.prepare(`INSERT INTO peer_messages (id, team_id, from_agent, to_agent, content, timestamp) VALUES (?, ?, ?, ?, ?, ?)`),
  getPeerMessagesByTeam: db.prepare(`SELECT * FROM peer_messages WHERE team_id = ? ORDER BY timestamp ASC`),

  insertTask: db.prepare(`INSERT OR REPLACE INTO tasks (id, team_id, content, status, assignee, created_at) VALUES (?, ?, ?, ?, ?, ?)`),
  getTasksByTeam: db.prepare(`SELECT * FROM tasks WHERE team_id = ?`),

  insertArtifact: db.prepare(`INSERT OR REPLACE INTO artifacts (id, team_id, agent, file_path, file_name, created_at) VALUES (?, ?, ?, ?, ?, ?)`),
  getArtifactsByTeam: db.prepare(`SELECT * FROM artifacts WHERE team_id = ? ORDER BY created_at DESC`),

  insertCost: db.prepare(`INSERT INTO cost_tracking (team_id, agent, model, input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens, cost_usd, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`),
  getCostByTeam: db.prepare(`SELECT agent, model, SUM(input_tokens) as input_tokens, SUM(output_tokens) as output_tokens, SUM(cache_read_tokens) as cache_read_tokens, SUM(cost_usd) as total_cost FROM cost_tracking WHERE team_id = ? GROUP BY agent`),
  getTotalCostByTeam: db.prepare(`SELECT SUM(cost_usd) as total_cost, SUM(input_tokens) as total_input, SUM(output_tokens) as total_output FROM cost_tracking WHERE team_id = ?`),
};

export const maestroDB = {
  // Teams
  saveTeam(team: TeamState, config?: string) {
    stmts.insertTeam.run(team.id, team.name, team.status, config || null, team.createdAt, Date.now());
    for (const agent of team.agents) {
      stmts.insertAgent.run(agent.id, team.id, agent.name, agent.role, agent.model || "claude-sonnet-4-6", agent.status);
    }
  },

  updateTeamStatus(teamId: string, status: string) {
    stmts.updateTeamStatus.run(status, Date.now(), teamId);
  },

  getTeam(teamId: string): TeamState | null {
    const row = stmts.getTeam.get(teamId) as Record<string, unknown> | undefined;
    if (!row) return null;
    return buildTeamState(row);
  },

  listTeams(): TeamState[] {
    const rows = stmts.listTeams.all() as Record<string, unknown>[];
    return rows.map(buildTeamState);
  },

  deleteTeam(teamId: string) {
    stmts.deleteTeam.run(teamId);
  },

  // Agents
  updateAgentStatus(agentId: string, status: string) {
    stmts.updateAgentStatus.run(status, agentId);
  },

  // Messages
  saveMessage(teamId: string, msg: AgentMessage) {
    stmts.insertMessage.run(msg.id, teamId, msg.agent, msg.content, msg.type, msg.timestamp);
  },

  getMessages(teamId: string): AgentMessage[] {
    return (stmts.getMessagesByTeam.all(teamId) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      agent: r.agent as string,
      content: r.content as string,
      type: r.type as AgentMessage["type"],
      timestamp: r.timestamp as number,
    }));
  },

  // Peer Messages
  savePeerMessage(teamId: string, msg: PeerMessage) {
    stmts.insertPeerMessage.run(msg.id, teamId, msg.from, msg.to, msg.content, msg.timestamp);
  },

  getPeerMessages(teamId: string): PeerMessage[] {
    return (stmts.getPeerMessagesByTeam.all(teamId) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      from: r.from_agent as string,
      to: r.to_agent as string,
      content: r.content as string,
      timestamp: r.timestamp as number,
    }));
  },

  // Tasks
  saveTask(teamId: string, task: Task) {
    stmts.insertTask.run(task.id, teamId, task.content, task.status, task.assignee || null, Date.now());
  },

  getTasks(teamId: string): Task[] {
    return (stmts.getTasksByTeam.all(teamId) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      content: r.content as string,
      status: r.status as Task["status"],
      assignee: (r.assignee as string) || undefined,
    }));
  },

  // Artifacts
  saveArtifact(teamId: string, agent: string, filePath: string) {
    const fileName = path.basename(filePath);
    const id = `${teamId}-${fileName}-${Date.now()}`;
    stmts.insertArtifact.run(id, teamId, agent, filePath, fileName, Date.now());
  },

  getArtifacts(teamId: string) {
    return (stmts.getArtifactsByTeam.all(teamId) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      agent: r.agent as string,
      filePath: r.file_path as string,
      fileName: r.file_name as string,
      createdAt: r.created_at as number,
    }));
  },

  // Cost tracking
  saveCost(teamId: string, agent: string, model: string, usage: { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number }, costUsd: number) {
    stmts.insertCost.run(teamId, agent, model, usage.input_tokens || 0, usage.output_tokens || 0, usage.cache_read_input_tokens || 0, usage.cache_creation_input_tokens || 0, costUsd, Date.now());
  },

  getCostByTeam(teamId: string) {
    return (stmts.getCostByTeam.all(teamId) as Record<string, unknown>[]).map((r) => ({
      agent: r.agent as string,
      model: r.model as string,
      inputTokens: r.input_tokens as number,
      outputTokens: r.output_tokens as number,
      cacheReadTokens: r.cache_read_tokens as number,
      totalCost: r.total_cost as number,
    }));
  },

  getTotalCost(teamId: string) {
    const row = stmts.getTotalCostByTeam.get(teamId) as Record<string, unknown> | undefined;
    return {
      totalCost: (row?.total_cost as number) || 0,
      totalInput: (row?.total_input as number) || 0,
      totalOutput: (row?.total_output as number) || 0,
    };
  },
};

function buildTeamState(row: Record<string, unknown>): TeamState {
  const teamId = row.id as string;
  const agentRows = stmts.getAgentsByTeam.all(teamId) as Record<string, unknown>[];

  return {
    id: teamId,
    name: row.name as string,
    status: row.status as TeamState["status"],
    agents: agentRows.map((a) => ({
      id: a.id as string,
      name: a.name as string,
      role: a.role as string,
      model: a.model as Agent["model"],
      status: a.status as Agent["status"],
    })),
    tasks: maestroDB.getTasks(teamId),
    messages: maestroDB.getMessages(teamId),
    peerMessages: maestroDB.getPeerMessages(teamId),
    createdAt: row.created_at as number,
  };
}

export default db;
