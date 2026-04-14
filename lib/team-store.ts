import type { TeamState } from "./types";
import type { ChildProcess } from "child_process";

interface StoredTeam {
  state: TeamState;
  process: ChildProcess | null;
}

const store = new Map<string, StoredTeam>();

export const teamStore = {
  get(id: string): StoredTeam | undefined {
    return store.get(id);
  },

  set(id: string, team: StoredTeam) {
    store.set(id, team);
  },

  getState(id: string): TeamState | undefined {
    return store.get(id)?.state;
  },

  updateState(id: string, update: Partial<TeamState>) {
    const existing = store.get(id);
    if (existing) {
      existing.state = { ...existing.state, ...update };
    }
  },

  getProcess(id: string): ChildProcess | null {
    return store.get(id)?.process ?? null;
  },

  delete(id: string) {
    const team = store.get(id);
    if (team?.process) {
      team.process.kill("SIGTERM");
    }
    store.delete(id);
  },

  list(): TeamState[] {
    return Array.from(store.values()).map((t) => t.state);
  },
};
