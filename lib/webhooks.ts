/**
 * Webhook system for Maestro.
 * Notifies external services when events occur (team done, agent error, etc.)
 */

export interface WebhookConfig {
  id: string;
  url: string;
  events: WebhookEvent[];
  enabled: boolean;
  secret?: string;
}

export type WebhookEvent = "team.created" | "team.completed" | "agent.done" | "agent.error" | "artifact.created";

// In-memory webhook store (could be persisted to SQLite)
const webhooks: WebhookConfig[] = [];

export function registerWebhook(config: Omit<WebhookConfig, "id">): WebhookConfig {
  const webhook: WebhookConfig = { ...config, id: Math.random().toString(36).substring(2, 10) };
  webhooks.push(webhook);
  return webhook;
}

export function listWebhooks(): WebhookConfig[] {
  return webhooks;
}

export function deleteWebhook(id: string) {
  const idx = webhooks.findIndex((w) => w.id === id);
  if (idx >= 0) webhooks.splice(idx, 1);
}

/**
 * Fire webhooks for an event
 */
export async function fireWebhook(event: WebhookEvent, payload: Record<string, unknown>) {
  const matching = webhooks.filter((w) => w.enabled && w.events.includes(event));

  for (const webhook of matching) {
    try {
      await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(webhook.secret ? { "X-Maestro-Secret": webhook.secret } : {}),
        },
        body: JSON.stringify({
          event,
          timestamp: Date.now(),
          ...payload,
        }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // Silently fail webhook delivery
    }
  }
}
