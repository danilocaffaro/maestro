import type { StreamEvent, AgentMessage, PeerMessage, Task, Agent } from "./types";
import { generateId } from "./utils";

// Track which agent is currently active based on context
let lastActiveAgent = "Lead";

/**
 * Try to extract the agent name from tool_use context.
 * The CLI emits Agent tool calls with the agent name in the prompt/name field.
 */
function extractAgentFromToolUse(data: Record<string, unknown>): string | null {
  const input = (data.input || data) as Record<string, unknown>;
  if (typeof input.name === "string" && input.name) return input.name;
  if (typeof input.agent === "string") return input.agent;
  return null;
}

/**
 * Detect SendMessage calls between agents (P2P communication)
 */
function detectPeerMessage(toolName: string, input: Record<string, unknown>): PeerMessage | null {
  if (toolName !== "SendMessage") return null;
  const to = (input.to as string) || "all";
  const message = (input.message as string) || (typeof input.message === "object" ? JSON.stringify(input.message) : "");
  const summary = (input.summary as string) || "";
  return {
    id: generateId(),
    from: lastActiveAgent,
    to,
    content: summary ? `${summary}: ${message}` : message,
    timestamp: Date.now(),
  };
}

/**
 * Detect TaskCreate/TaskUpdate for task tracking
 */
function detectTaskUpdate(toolName: string, input: Record<string, unknown>): Task | null {
  if (toolName === "TodoWrite" && Array.isArray(input.todos)) {
    // Return the first in_progress task
    const active = (input.todos as Array<Record<string, string>>).find(
      (t) => t.status === "in_progress"
    );
    if (active) {
      return {
        id: generateId(),
        content: active.content || active.activeForm || "",
        status: "in_progress",
        assignee: lastActiveAgent,
      };
    }
  }
  return null;
}

export function parseStreamLine(teamId: string, line: string): StreamEvent[] {
  if (!line.trim()) return [];

  try {
    const data = JSON.parse(line);
    const events: StreamEvent[] = [];

    // System init
    if (data.type === "system" && data.subtype === "init") {
      events.push({
        type: "agent-message",
        teamId,
        data: {
          id: generateId(),
          agent: "System",
          content: `Sessao iniciada (model: ${data.model || "unknown"})`,
          timestamp: Date.now(),
          type: "text",
        },
        timestamp: Date.now(),
      });
      return events;
    }

    // Assistant message
    if (data.type === "assistant" && data.message) {
      const contentBlocks = data.message.content || [];

      for (const block of contentBlocks) {
        // Text content
        if (block.type === "text" && block.text) {
          // Try to detect agent name from text patterns like "**Nova**: ..." or "[Nova]"
          const agentMatch = block.text.match(/^\*\*(\w+)\*\*[:\s]/);
          if (agentMatch) lastActiveAgent = agentMatch[1];

          events.push({
            type: "agent-message",
            teamId,
            data: {
              id: generateId(),
              agent: lastActiveAgent,
              content: block.text,
              timestamp: Date.now(),
              type: "text",
            },
            timestamp: Date.now(),
          });

          // Emit agent status: working
          events.push({
            type: "agent-status",
            teamId,
            data: { id: `${teamId}-${lastActiveAgent}`, name: lastActiveAgent, role: "", status: "working" } as Agent,
            timestamp: Date.now(),
          });
        }

        // Tool use
        if (block.type === "tool_use") {
          const toolName = block.name || "tool";
          const input = block.input || {};

          // Detect Agent spawning (changes active agent context)
          if (toolName === "Agent" && input.name) {
            const agentName = input.name as string;
            events.push({
              type: "agent-status",
              teamId,
              data: { id: `${teamId}-${agentName}`, name: agentName, role: "", status: "working" } as Agent,
              timestamp: Date.now(),
            });
          }

          // Detect SendMessage (P2P communication)
          const peerMsg = detectPeerMessage(toolName, input as Record<string, unknown>);
          if (peerMsg) {
            events.push({
              type: "peer-message",
              teamId,
              data: peerMsg,
              timestamp: Date.now(),
            });
          }

          // Detect task updates
          const task = detectTaskUpdate(toolName, input as Record<string, unknown>);
          if (task) {
            events.push({ type: "task-update", teamId, data: task, timestamp: Date.now() });
          }

          // Emit tool_use message
          const inputStr = JSON.stringify(input).substring(0, 300);
          events.push({
            type: "agent-message",
            teamId,
            data: {
              id: generateId(),
              agent: lastActiveAgent,
              content: `${toolName}: ${inputStr}`,
              timestamp: Date.now(),
              type: "tool_use",
            },
            timestamp: Date.now(),
          });
        }
      }

      return events;
    }

    // Tool result - raw JSON from CLI
    if (data.type === "tool_result" || (data.role === "user" && Array.isArray(data.content))) {
      // Parse tool results to find agent spawn confirmations, messages, etc.
      const contents = data.content || [];
      for (const item of Array.isArray(contents) ? contents : [contents]) {
        if (item.type === "tool_result" && typeof item.content === "string") {
          // Check for agent spawn success
          const spawnMatch = item.content.match(/name:\s*(\w+)/);
          if (spawnMatch) {
            events.push({
              type: "agent-status",
              teamId,
              data: { id: `${teamId}-${spawnMatch[1]}`, name: spawnMatch[1], role: "", status: "idle" } as Agent,
              timestamp: Date.now(),
            });
          }
        }
      }
      return events; // Don't emit raw tool results as messages anymore (too noisy)
    }

    // Result (final)
    if (data.type === "result") {
      if (data.result && typeof data.result === "string" && data.result.length > 0) {
        events.push({
          type: "agent-message",
          teamId,
          data: {
            id: generateId(),
            agent: "System",
            content: `Sessao finalizada. ${data.result.substring(0, 300)}`,
            timestamp: Date.now(),
            type: "text",
          },
          timestamp: Date.now(),
        });
      }
      // Mark all agents idle
      events.push({
        type: "agent-status",
        teamId,
        data: { id: `${teamId}-Lead`, name: "Lead", role: "", status: "done" } as Agent,
        timestamp: Date.now(),
      });
      return events;
    }

    // Rate limit - ignore
    if (data.type === "rate_limit_event") return [];

    // Fallback for unhandled content
    if (data.content || data.text || data.message) {
      const content = typeof data.content === "string" ? data.content
        : typeof data.text === "string" ? data.text
        : typeof data.message === "string" ? data.message
        : "";
      if (content) {
        events.push({
          type: "agent-message",
          teamId,
          data: { id: generateId(), agent: "System", content: content.substring(0, 500), timestamp: Date.now(), type: "text" },
          timestamp: Date.now(),
        });
      }
    }

    return events;
  } catch {
    // Not JSON - raw text
    if (line.trim()) {
      return [{
        type: "agent-message",
        teamId,
        data: { id: generateId(), agent: "System", content: line, timestamp: Date.now(), type: "text" },
        timestamp: Date.now(),
      }];
    }
    return [];
  }
}
