import { BaseClient } from "../client.js";
import type { Webhook, WebhookDelivery } from "../types.js";

export class Webhooks {
  constructor(private client: BaseClient) {}

  /** List all webhooks. */
  async list(): Promise<Webhook[]> {
    const res = await this.client.request<{ webhooks: Webhook[] }>(
      "GET",
      "/api/user/webhooks"
    );
    return res.webhooks;
  }

  /** Create a webhook. URL must be HTTPS. Max 1 webhook per user. */
  async create(options: {
    url: string;
    events?: string[];
  }): Promise<Webhook> {
    return this.client.request("POST", "/api/user/webhooks", {
      body: options,
    });
  }

  /** Delete a webhook. */
  async delete(webhookId: string): Promise<void> {
    return this.client.request("DELETE", `/api/user/webhooks/${webhookId}`);
  }

  /** Rotate webhook signing secret. Also resets failure count. */
  async rotateSecret(webhookId: string): Promise<{ id: string; secret: string }> {
    return this.client.request("POST", `/api/user/webhooks/${webhookId}/rotate`);
  }

  /** List delivery attempts for a webhook (last 20). */
  async listDeliveries(webhookId: string): Promise<WebhookDelivery[]> {
    const res = await this.client.request<{ deliveries: WebhookDelivery[] }>(
      "GET",
      `/api/user/webhooks/${webhookId}/deliveries`
    );
    return res.deliveries;
  }
}
