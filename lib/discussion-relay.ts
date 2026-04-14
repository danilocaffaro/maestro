import { maestroDB } from "./db";
import { eventBus } from "./event-bus";
import { generateId } from "./utils";
import type { PeerMessage } from "./types";

/**
 * Discussion Relay - enables visible inter-agent communication.
 *
 * When agent A produces significant output (text > 100 chars),
 * the relay creates a P2P message visible in the UI and optionally
 * appends to the shared context file for other agents to read.
 *
 * This makes agent discussions VISIBLE in the Chat Agentes / P2P tab.
 */

// Track recent messages to avoid duplicate relays
const recentRelays = new Map<string, number>();

/**
 * Check if a message should be relayed to other agents
 */
function shouldRelay(content: string, agentName: string): boolean {
  // Skip system messages
  if (agentName === "System" || agentName === "Voce") return false;

  // Only relay substantive text messages (not tool calls)
  if (content.length < 100) return false;

  // Check for discussion-like patterns
  const discussionPatterns = [
    /recomendo|sugiro|proponho/i,
    /considere|avalie|analise/i,
    /encontrei|descobri|identifiquei/i,
    /concordo|discordo|alternativa/i,
    /resultado|conclus|relatorio/i,
    /pronto|concluido|finaliz/i,
  ];

  return discussionPatterns.some((p) => p.test(content));
}

/**
 * Generate a discussion summary from agent output
 */
function generateSummary(content: string, maxLen: number = 200): string {
  // Take first paragraph or first N chars
  const firstPara = content.split("\n\n")[0];
  if (firstPara.length <= maxLen) return firstPara;
  return firstPara.substring(0, maxLen) + "...";
}

/**
 * Relay a message from one agent to the team as a P2P discussion message
 */
export function relayDiscussion(
  teamId: string,
  fromAgent: string,
  content: string,
  allAgentNames: string[]
) {
  if (!shouldRelay(content, fromAgent)) return;

  // Dedup: don't relay same message twice in 10s
  const key = `${teamId}:${fromAgent}:${content.substring(0, 50)}`;
  const lastRelay = recentRelays.get(key);
  if (lastRelay && Date.now() - lastRelay < 10000) return;
  recentRelays.set(key, Date.now());

  // Clean old entries
  const now = Date.now();
  for (const [k, v] of recentRelays) {
    if (now - v > 30000) recentRelays.delete(k);
  }

  const summary = generateSummary(content);
  const recipients = allAgentNames.filter((n) => n !== fromAgent);

  if (recipients.length === 0) return;

  // Create P2P message for each recipient
  for (const to of recipients) {
    const msg: PeerMessage = {
      id: generateId(),
      from: fromAgent,
      to,
      content: summary,
      timestamp: Date.now(),
    };

    eventBus.emitTeamEvent(teamId, { type: "peer-message", teamId, data: msg, timestamp: Date.now() });
    maestroDB.savePeerMessage(teamId, msg);
  }
}
