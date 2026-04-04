import { BaseClient } from "../client.js";
import { solvePow } from "../pow.js";
import type {
  AccountInfo,
  CreateAccountResult,
  LoginResult,
  Domain,
  PoWSolution,
} from "../types.js";

const DEFAULT_DIFFICULTY = 15;

interface PowRetryResponse {
  status: "retry";
  required_difficulty: number;
  token: string;
}

export class Accounts {
  private cachedDifficulty = DEFAULT_DIFFICULTY;

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
   * For Pro users (token configured), sends the request directly.
   * For free users, computes a Proof-of-Work challenge locally
   * and handles one server-initiated difficulty step-up if needed.
   */
  async create(
    address: string,
    options?: { password?: string; authKey?: string }
  ): Promise<CreateAccountResult> {
    const baseBody: Record<string, unknown> = {
      address,
      password: options?.password,
      auth_key: options?.authKey,
    };

    // Pro users skip PoW entirely
    if (this.client.hasToken()) {
      return this.client.request<CreateAccountResult>(
        "POST",
        "/api/accounts",
        { body: baseBody }
      );
    }

    // Normalize address for PoW — server verifies against lowercased form.
    const powAddress = address.toLowerCase().trim();

    // Free user: solve PoW locally, starting from cached difficulty.
    const pow = solvePow(powAddress, this.cachedDifficulty);
    const firstResult = await this.client.request<
      CreateAccountResult | PowRetryResponse
    >("POST", "/api/accounts", {
      body: { ...baseBody, pow: { t: pow.t, n: pow.n, d: pow.d } },
    });

    // Handle difficulty step-up (max 1 retry)
    if (
      (firstResult as PowRetryResponse).status === "retry" &&
      (firstResult as PowRetryResponse).required_difficulty
    ) {
      const retry = firstResult as PowRetryResponse;
      this.cachedDifficulty = retry.required_difficulty;
      const powRetry: PoWSolution = {
        ...solvePow(powAddress, retry.required_difficulty),
        token: retry.token,
      };
      const result = await this.client.request<CreateAccountResult>(
        "POST",
        "/api/accounts",
        {
          body: {
            ...baseBody,
            pow: {
              t: powRetry.t,
              n: powRetry.n,
              d: powRetry.d,
              token: powRetry.token,
            },
          },
        }
      );
      if (result.suggested_next_difficulty) {
        this.cachedDifficulty = result.suggested_next_difficulty;
      }
      return result;
    }

    const result = firstResult as CreateAccountResult;
    if (result.suggested_next_difficulty) {
      this.cachedDifficulty = result.suggested_next_difficulty;
    }
    return result;
  }

  /**
   * Sign in to an existing mailbox. Returns a JWT token.
   */
  async login(
    address: string,
    options: { password?: string; authKey?: string }
  ): Promise<LoginResult> {
    return this.client.request<LoginResult>("POST", "/api/token", {
      body: {
        address,
        password: options.password,
        auth_key: options.authKey,
      },
    });
  }

  /** Get mailbox info by account ID. */
  async get(accountId: string): Promise<AccountInfo> {
    return this.client.request<AccountInfo>(
      "GET",
      `/api/accounts/${accountId}`
    );
  }

  /** Delete a mailbox and all its emails permanently. */
  async delete(accountId: string): Promise<void> {
    return this.client.request<void>(
      "DELETE",
      `/api/accounts/${accountId}`
    );
  }

  /** Reset a mailbox password. Invalidates all existing JWTs. */
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
