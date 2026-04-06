import { BaseClient, APIError } from "./client.js";
import { Accounts } from "./resources/accounts.js";
import { Messages } from "./resources/messages.js";
import { Domains } from "./resources/domains.js";
import { Webhooks } from "./resources/webhooks.js";
import { Tokens } from "./resources/tokens.js";
import { Sandbox } from "./resources/sandbox.js";
import { Billing } from "./resources/billing.js";
import { User } from "./resources/user.js";
import type { ClientOptions } from "./types.js";

export class MailTD extends BaseClient {
  /** Mailbox creation and account management. */
  public readonly accounts: Accounts;
  /** Email message operations (list, get, delete, attachments). */
  public readonly messages: Messages;
  /** Custom domain management (Pro). */
  public readonly domains: Domains;
  /** Webhook management (Pro). */
  public readonly webhooks: Webhooks;
  /** API token management (Pro). */
  public readonly tokens: Tokens;
  /** SMTP sandbox (Pro). */
  public readonly sandbox: Sandbox;
  /** Subscription and billing (Pro). */
  public readonly billing: Billing;
  /** Pro user profile and account management. */
  public readonly user: User;

  /**
   * Create a new Mail.td API client.
   *
   * @example
   * ```typescript
   * const client = new MailTD({ token: 'tm_pro_...' });
   * const messages = await client.messages.list(accountId);
   * ```
   */
  constructor(options?: ClientOptions | string) {
    const opts = typeof options === "string" ? { token: options } : options ?? {};
    super(opts);
    this.accounts = new Accounts(this);
    this.messages = new Messages(this);
    this.domains = new Domains(this);
    this.webhooks = new Webhooks(this);
    this.tokens = new Tokens(this);
    this.sandbox = new Sandbox(this);
    this.billing = new Billing(this);
    this.user = new User(this);
  }
}

export { APIError };
export type * from "./types.js";
