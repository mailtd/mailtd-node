import type { ClientOptions, MailTDError } from "./types.js";

export class APIError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, body: MailTDError) {
    super(body.error);
    this.name = "APIError";
    this.status = status;
    this.code = body.error;
  }
}

export class BaseClient {
  protected readonly baseUrl: string;
  protected readonly token?: string;

  constructor(options: ClientOptions) {
    this.baseUrl = (options.baseUrl ?? "https://api.mail.td").replace(/\/$/, "");
    this.token = options.token;
  }

  /** Returns true if a Pro API token is configured. */
  hasToken(): boolean {
    return !!this.token;
  }

  /** @internal */
  async request<T>(
    method: string,
    path: string,
    options?: { body?: unknown; query?: Record<string, string>; raw?: boolean }
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    if (options?.query) {
      const params = new URLSearchParams(options.query);
      url += `?${params}`;
    }

    const headers: Record<string, string> = {};
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    if (options?.body) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!res.ok) {
      let body: MailTDError;
      try {
        body = (await res.json()) as MailTDError;
      } catch {
        body = { error: `http_${res.status}` };
      }
      throw new APIError(res.status, body);
    }

    if (res.status === 204) return undefined as T;

    if (options?.raw) {
      return (await res.arrayBuffer()) as T;
    }

    return (await res.json()) as T;
  }
}
