import { BaseClient } from "../client.js";
import { buildResetPasswordBody, deriveAuthKey } from "../crypto.js";
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
   *
   * If `options.authKey` is set it is sent as-is. Otherwise, if
   * `options.password` is set the SDK derives the auth_key locally via
   * Argon2id (see {@link deriveAuthKey}) and the password never leaves the
   * client process.
   */
  async create(
    address: string,
    options?: { password?: string; authKey?: string }
  ): Promise<CreateAccountResult> {
    const body: Record<string, unknown> = { address };
    if (options?.authKey != null) {
      body.auth_key = options.authKey;
    } else if (options?.password != null) {
      body.auth_key = await deriveAuthKey(address, options.password);
    }

    return this.client.request<CreateAccountResult>(
      "POST",
      "/api/accounts",
      { body }
    );
  }

  /**
   * Authenticate a mailbox and return a mailbox-scoped JWT.
   *
   * If `options.authKey` is set it is sent as-is. Otherwise, if
   * `options.password` is set the SDK derives the auth_key locally via
   * Argon2id (see {@link deriveAuthKey}) and the password never leaves the
   * client process.
   *
   * The returned token grants access to /api/accounts/{id}/* endpoints when
   * addressed by UUID. Use it with a fresh client:
   *
   * ```ts
   * const { id, token } = await client.accounts.login(addr, { password });
   * const mb = new MailTD({ token });
   * const msgs = await mb.messages.list(id);
   * ```
   */
  async login(
    address: string,
    options: { password?: string; authKey?: string }
  ): Promise<{ id: string; address: string; token: string }> {
    let auth_key: string;
    if (options.authKey != null) {
      auth_key = options.authKey;
    } else if (options.password != null) {
      auth_key = await deriveAuthKey(address, options.password);
    } else {
      throw new Error("mailtd: login requires password or authKey");
    }
    return this.client.request<{ id: string; address: string; token: string }>(
      "POST",
      "/api/token",
      { body: { address, auth_key } }
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

  /** Reset a mailbox password. Invalidates all existing tokens.
   *
   * If `options.password` is provided, the SDK derives the auth_key locally;
   * the derivation needs the mailbox's email address. If `accountId` is
   * already an email it is used directly, otherwise `options.address` must
   * be supplied.
   *
   * @param accountId - Account ID (UUID) or email address. */
  async resetPassword(
    accountId: string,
    options: { password?: string; authKey?: string; address?: string }
  ): Promise<void> {
    const body = await buildResetPasswordBody(accountId, options);
    await this.client.request(
      "PUT",
      `/api/accounts/${accountId}/reset-password`,
      { body }
    );
  }
}
