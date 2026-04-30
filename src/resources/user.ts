import { BaseClient } from "../client.js";
import { buildResetPasswordBody } from "../crypto.js";
import type { ProUser, Account, EmailSummary } from "../types.js";

export class User {
  constructor(private client: BaseClient) {}

  /** Get the authenticated Pro user's profile. */
  async getMe(): Promise<ProUser> {
    return this.client.request("GET", "/api/user/me");
  }

  /** List a page of mailboxes under the Pro account with cursor-based pagination. */
  async listAccountsPage(options?: {
    cursor?: string;
  }): Promise<{ accounts: Account[]; next_cursor: string }> {
    const query: Record<string, string> = {};
    if (options?.cursor) query.cursor = options.cursor;
    return this.client.request("GET", "/api/user/accounts", { query });
  }

  /**
   * List all mailboxes under the Pro account.
   * @deprecated Use listAccountsPage() for cursor-based pagination.
   */
  async listAccounts(): Promise<Account[]> {
    const res = await this.listAccountsPage();
    return res.accounts;
  }

  /** Delete a mailbox under the Pro account.
   * @param accountId - Account ID (UUID) or email address. */
  async deleteAccount(accountId: string): Promise<void> {
    return this.client.request("DELETE", `/api/user/accounts/${accountId}`);
  }

  /** Reset a mailbox password under the Pro account.
   *
   * If `options.password` is provided, the SDK derives the auth_key locally.
   * For UUID account IDs, `options.address` must be supplied so the SDK can
   * compute the Argon2 salt.
   *
   * @param accountId - Account ID (UUID) or email address. */
  async resetAccountPassword(
    accountId: string,
    options: { password?: string; authKey?: string; address?: string }
  ): Promise<void> {
    const body = await buildResetPasswordBody(accountId, options);
    await this.client.request("PUT", `/api/user/accounts/${accountId}/reset-password`, { body });
  }

  /** List messages for a specific mailbox under the Pro account.
   * @param accountId - Account ID (UUID) or email address. */
  async listAccountMessages(
    accountId: string,
    options?: { page?: number }
  ): Promise<{ messages: EmailSummary[]; page: number }> {
    const query: Record<string, string> = {};
    if (options?.page) query.page = String(options.page);
    return this.client.request("GET", `/api/user/accounts/${accountId}/messages`, { query });
  }
}
