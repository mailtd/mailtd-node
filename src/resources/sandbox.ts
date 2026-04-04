import { BaseClient } from "../client.js";
import type { SandboxInfo, SandboxEmailSummary, EmailDetail } from "../types.js";

export class Sandbox {
  constructor(private client: BaseClient) {}

  /** Get sandbox status and SMTP credentials. */
  async getInfo(): Promise<SandboxInfo> {
    return this.client.request("GET", "/api/user/sandbox");
  }

  /** List sandbox messages. Returns up to 30 per page. */
  async listMessages(options?: {
    page?: number;
  }): Promise<{ messages: SandboxEmailSummary[]; page: number }> {
    const query: Record<string, string> = {};
    if (options?.page) query.page = String(options.page);
    return this.client.request("GET", "/api/user/sandbox/messages", { query });
  }

  /** Get a single sandbox message. */
  async getMessage(messageId: string): Promise<EmailDetail> {
    return this.client.request("GET", `/api/user/sandbox/messages/${messageId}`);
  }

  /** Delete a single sandbox message. */
  async deleteMessage(messageId: string): Promise<void> {
    await this.client.request("DELETE", `/api/user/sandbox/messages/${messageId}`);
  }

  /** Purge all sandbox messages. */
  async purgeMessages(): Promise<{ deleted: number }> {
    return this.client.request("DELETE", "/api/user/sandbox/messages");
  }

  /** Download raw EML source of a sandbox message. */
  async getMessageSource(messageId: string): Promise<ArrayBuffer> {
    return this.client.request("GET", `/api/user/sandbox/messages/${messageId}/source`, { raw: true });
  }

  /** Download an attachment from a sandbox message. */
  async getAttachment(messageId: string, index: number): Promise<ArrayBuffer> {
    return this.client.request("GET", `/api/user/sandbox/messages/${messageId}/attachments/${index}`, { raw: true });
  }
}
