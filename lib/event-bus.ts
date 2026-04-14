import { EventEmitter } from "events";
import type { StreamEvent } from "./types";

class TypedEventBus extends EventEmitter {
  emitTeamEvent(teamId: string, event: StreamEvent) {
    this.emit(`team:${teamId}`, event);
  }

  onTeamEvent(teamId: string, handler: (event: StreamEvent) => void) {
    this.on(`team:${teamId}`, handler);
    return () => {
      this.off(`team:${teamId}`, handler);
    };
  }
}

export const eventBus = new TypedEventBus();
eventBus.setMaxListeners(50);
