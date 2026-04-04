import { BaseClient } from "../client.js";
import type { ProUser, Account, EmailSummary } from "../types.js";

export class User {
  constructor(private client: BaseClient) {}

  /** Get the authenticated Pro user's profile. */
  async getMe(): Promise<ProUser> {
    return this.client.request("GET", "/api/user/me");
  }

  /** List all mailboxes under the Pro account. */
  async listAccounts(): Promise<Account[]> {
    const res = await this.client.request<{ accounts: Account[] }>(
      "GET",
      "/api/user/accounts"
    );
    return res.accounts;
  }

  /** Delete a mailbox under the Pro account. */
  async deleteAccount(accountId: string): Promise<void> {
    return this.client.request("DELETE", `/api/user/accounts/${accountId}`);
  }

  /** Reset a mailbox password under the Pro account. */
  async resetAccountPassword(
    accountId: string,
    options: { password?: string; authKey?: string }
  ): Promise<void> {
    await this.client.request("PUT", `/api/user/accounts/${accountId}/reset-password`, {
      body: { password: options.password, auth_key: options.authKey },
    });
  }

  /** List messages for a specific mailbox under the Pro account. */
  async listAccountMessages(
    accountId: string,
    options?: { page?: number }
  ): Promise<{ messages: EmailSummary[]; page: number }> {
    const query: Record<string, string> = {};
    if (options?.page) query.page = String(options.page);
    return this.client.request("GET", `/api/user/accounts/${accountId}/messages`, { query });
  }
}
