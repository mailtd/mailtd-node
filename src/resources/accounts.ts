import { BaseClient } from "../client.js";
import type {
  AccountInfo,
  CreateAccountResult,
  Domain,
} from "../types.js";

export class Accounts {
  constructor(private client: BaseClient) {}

  /** List available system domains for creating mailboxes. */
  async listDomains(): Promise<Domain[]> {
    const res = await this.client.request<{ domains: Domain[] }>(
      "GET",
      "/api/domains"
    );
    return res.domains;
  }

  /**
   * Create a new mailbox.
   */
  async create(
    address: string,
    options?: { password?: string; authKey?: string }
  ): Promise<CreateAccountResult> {
    const body: Record<string, unknown> = {
      address,
      password: options?.password,
      auth_key: options?.authKey,
    };

    return this.client.request<CreateAccountResult>(
      "POST",
      "/api/accounts",
      { body }
    );
  }

  /** Get mailbox info.
   * @param accountId - Account ID (UUID) or email address. */
  async get(accountId: string): Promise<AccountInfo> {
    return this.client.request<AccountInfo>(
      "GET",
      `/api/accounts/${accountId}`
    );
  }

  /** Delete a mailbox and all its emails permanently.
   * @param accountId - Account ID (UUID) or email address. */
  async delete(accountId: string): Promise<void> {
    return this.client.request<void>(
      "DELETE",
      `/api/accounts/${accountId}`
    );
  }

  /** Reset a mailbox password. Invalidates all existing JWTs.
   * @param accountId - Account ID (UUID) or email address. */
  async resetPassword(
    accountId: string,
    options: { password?: string; authKey?: string }
  ): Promise<void> {
    await this.client.request(
      "PUT",
      `/api/accounts/${accountId}/reset-password`,
      {
        body: {
          password: options.password,
          auth_key: options.authKey,
        },
      }
    );
  }
}
