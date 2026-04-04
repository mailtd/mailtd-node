import { BaseClient } from "../client.js";
import type { Token } from "../types.js";

export class Tokens {
  constructor(private client: BaseClient) {}

  /** List all API tokens. */
  async list(): Promise<Token[]> {
    const res = await this.client.request<{ tokens: Token[] }>(
      "GET",
      "/api/user/tokens"
    );
    return res.tokens;
  }

  /** Create an API token. The full token value is only returned once. */
  async create(name?: string): Promise<{ id: string; name: string; token: string }> {
    return this.client.request("POST", "/api/user/tokens", {
      body: { name: name ?? "API Token" },
    });
  }

  /** Revoke an API token. */
  async revoke(tokenId: string): Promise<void> {
    return this.client.request("DELETE", `/api/user/tokens/${tokenId}`);
  }
}
