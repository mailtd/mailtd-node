import { BaseClient } from "../client.js";
import type { ProDomain, CreateDomainResult, VerifyDomainResult } from "../types.js";

export class Domains {
  constructor(private client: BaseClient) {}

  /** List custom domains. */
  async list(): Promise<ProDomain[]> {
    const res = await this.client.request<{ domains: ProDomain[] }>(
      "GET",
      "/api/user/domains"
    );
    return res.domains;
  }

  /** Add a custom domain. Returns DNS records for verification. */
  async create(domain: string): Promise<CreateDomainResult> {
    return this.client.request("POST", "/api/user/domains", {
      body: { domain },
    });
  }

  /** Verify domain DNS configuration. */
  async verify(domainId: string): Promise<VerifyDomainResult> {
    return this.client.request("POST", `/api/user/domains/${domainId}/verify`);
  }

  /** Delete a custom domain. */
  async delete(domainId: string): Promise<void> {
    return this.client.request("DELETE", `/api/user/domains/${domainId}`);
  }
}
