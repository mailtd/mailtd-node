export interface Domain {
  id: string;
  domain: string;
  default: boolean;
  sort_order: number;
}

export interface AccountInfo {
  id: string;
  address: string;
  role: string;
  quota: number;
  used: number;
  created_at: string;
}

export interface Account {
  id: string;
  address: string;
  quota: number;
  used: number;
  created_at: string;
}

export interface CreateAccountResult {
  id: string;
  address: string;
  token: string;
}

export interface EmailSummary {
  id: string;
  sender: string;
  from: string | null;
  subject: string | null;
  preview_text: string | null;
  size: number;
  is_read: boolean;
  created_at: string;
}

export interface Attachment {
  index: number;
  filename: string;
  content_type: string;
  size: number;
}

export interface EmailDetail {
  id: string;
  sender: string;
  from: string | null;
  subject: string | null;
  address: string;
  size: number;
  created_at: string;
  text_body: string | null;
  html_body: string | null;
  attachments: Attachment[];
}

export interface ProUser {
  id: string;
  email: string;
  plan: string;
  role: string;
  status: "pending" | "active" | "suspended";
  max_accounts: number;
  max_domains: number;
  account_count: number;
  domain_count: number;
  created_at: string;
  downgraded: boolean;
}

export interface ProDomain {
  id: string;
  domain: string;
  verify_status: "pending" | "verified" | "failed";
  verify_token: string;
  verified_at: string | null;
  mx_configured: boolean;
  created_at: string;
}

export interface DNSRecord {
  type: string;
  host: string;
  value: string;
  priority?: number | null;
  ok?: boolean;
}

export interface CreateDomainResult {
  id: string;
  domain: string;
  verify_token: string;
  dns_records: DNSRecord[];
}

export interface VerifyDomainResult {
  verify_status: "verified" | "pending";
  txt_record: boolean;
  mx_record: boolean;
  dns_records?: (DNSRecord & { ok: boolean })[];
  message?: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  status: "active" | "failed";
  failure_count?: number;
  last_triggered_at: string | null;
  created_at: string;
}

export interface WebhookDelivery {
  id: string;
  event_type: string;
  event_id: string;
  status_code: number | null;
  error: string | null;
  attempt: number;
  duration_ms: number | null;
  created_at: string;
}

export interface Token {
  id: string;
  name: string;
  token?: string;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

export interface SandboxInfo {
  enabled: boolean;
  account_id: string | null;
  address: string | null;
  smtp_host: string;
  smtp_port: number;
  auth_method: string;
  username: string;
  note: string;
  quota: number | null;
  used: number | null;
}

export interface SandboxEmailSummary {
  id: string;
  sender: string;
  from: string | null;
  subject: string | null;
  preview_text: string | null;
  size: number;
  created_at: string;
}

export interface SubscriptionStatus {
  status: "" | "active" | "canceled" | "past_due";
  cancel_mode: string;
  scheduled_cancel_at: { action: string; effective_at: string } | null;
}

export interface MailTDError {
  error: string;
}

export interface ClientOptions {
  baseUrl?: string;
  token?: string;
}
