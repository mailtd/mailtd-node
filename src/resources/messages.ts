import { BaseClient } from "../client.js";
import type { EmailSummary, EmailDetail } from "../types.js";

export class Messages {
  constructor(private client: BaseClient) {}

  /** List messages for a mailbox. Returns up to 30 per page.
   * @param accountId - Account ID (UUID) or email address. */
  async list(
    accountId: string,
    options?: { page?: number }
  ): Promise<{ messages: EmailSummary[]; page: number }> {
    const query: Record<string, string> = {};
    if (options?.page) query.page = String(options.page);
    return this.client.request("GET", `/api/accounts/${accountId}/messages`, { query });
  }

  /** Get a single message with full body and attachment metadata.
   * @param accountId - Account ID (UUID) or email address. */
  async get(accountId: string, messageId: string): Promise<EmailDetail> {
    return this.client.request("GET", `/api/accounts/${accountId}/messages/${messageId}`);
  }

  /** Delete a single message.
   * @param accountId - Account ID (UUID) or email address. */
  async delete(accountId: string, messageId: string): Promise<void> {
    return this.client.request("DELETE", `/api/accounts/${accountId}/messages/${messageId}`);
  }

  /** Download raw EML source of a message.
   * @param accountId - Account ID (UUID) or email address. */
  async getSource(accountId: string, messageId: string): Promise<ArrayBuffer> {
    return this.client.request("GET", `/api/accounts/${accountId}/messages/${messageId}/source`, { raw: true });
  }

  /** Mark a single message as read. Idempotent.
   * @param accountId - Account ID (UUID) or email address. */
  async markAsRead(accountId: string, messageId: string): Promise<void> {
    return this.client.request("PUT", `/api/accounts/${accountId}/messages/${messageId}/read`);
  }

  /**
   * Batch mark messages as read.
   * Either provide an array of message IDs, or set `all: true` to mark everything.
   * @param accountId - Account ID (UUID) or email address.
   */
  async batchMarkAsRead(
    accountId: string,
    options: { ids?: string[]; all?: boolean }
  ): Promise<{ updated: number }> {
    return this.client.request("PUT", `/api/accounts/${accountId}/messages/read`, {
      body: options,
    });
  }

  /** Download an attachment by its zero-based index.
   * @param accountId - Account ID (UUID) or email address. */
  async getAttachment(
    accountId: string,
    messageId: string,
    index: number
  ): Promise<ArrayBuffer> {
    return this.client.request("GET", `/api/accounts/${accountId}/messages/${messageId}/attachments/${index}`, { raw: true });
  }
}
