import { BaseClient } from "../client.js";
import type { SubscriptionStatus } from "../types.js";

export class Billing {
  constructor(private client: BaseClient) {}

  /** Get subscription status. */
  async getStatus(): Promise<SubscriptionStatus> {
    return this.client.request("GET", "/api/user/subscription/status");
  }

  /** Cancel subscription. Within 14 days: full refund. After: cancel at end of period. */
  async cancel(): Promise<{ cancel_mode: string }> {
    return this.client.request("POST", "/api/user/subscription/cancel");
  }

  /** Resume a scheduled cancellation. */
  async resume(): Promise<{ status: string }> {
    return this.client.request("POST", "/api/user/subscription/resume");
  }

  /** Get billing portal URL for managing payment methods. */
  async getPortalUrl(): Promise<string> {
    const res = await this.client.request<{ url: string }>(
      "POST",
      "/api/user/billing/portal"
    );
    return res.url;
  }
}
