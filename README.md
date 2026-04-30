# mailtd

[![npm version](https://img.shields.io/npm/v/mailtd.svg)](https://www.npmjs.com/package/mailtd)
[![npm downloads](https://img.shields.io/npm/dm/mailtd.svg)](https://www.npmjs.com/package/mailtd)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Official Node.js SDK for [Mail.td](https://mail.td) — temp mail & temporary email with REST API, webhooks, and custom domains. Instant inboxes, password protected, sign in from any device.

- **Temp Mail API** — Create and manage temporary email addresses programmatically
- **Webhooks** — Get notified in real-time when emails arrive
- **Custom Domains** — Use your own domain for branded temporary mailboxes
- **Password Protected** — Sign in to the same mailbox from any device

## Install

```bash
npm install mailtd
```

Requires Node.js 18+.

## Quick Start

```typescript
import { MailTD } from 'mailtd';

const client = new MailTD('td_...');

// Create a temporary email address
const account = await client.accounts.create('test@mail.td', {
  password: 'mypassword',
});

// List messages
const { messages } = await client.messages.list(account.id);

// Get a message
const message = await client.messages.get(account.id, messages[0].id);
console.log(message.subject, message.text_body);
```

## Use Cases

- **Automated testing** — Create temp mail addresses in CI/CD to test signup flows, OTP verification, and transactional emails
- **Email verification testing** — Validate that your app sends the right emails with the right content
- **QA environments** — Give each test run its own mailbox, then tear it down

## Authentication

All API calls require a Pro API Token (`td_...`). Pass it when creating the client:

```typescript
// With a token string
const client = new MailTD('td_...');

// With options
const client = new MailTD({
  token: 'td_...',
  baseUrl: 'https://api.mail.td', // default
});
```

## Resources

### Accounts

```typescript
// List available domains
const domains = await client.accounts.listDomains();

// Create a mailbox
const account = await client.accounts.create('user@mail.td', {
  password: 'pass123',
});

// Get mailbox info
const info = await client.accounts.get(accountId);

// Reset password
await client.accounts.resetPassword(accountId, { password: 'newpass' });

// Delete a mailbox
await client.accounts.delete(accountId);
```

### Messages

```typescript
// List messages (30 per page)
const { messages, page } = await client.messages.list(accountId);
const page2 = await client.messages.list(accountId, { page: 2 });

// Get full message
const msg = await client.messages.get(accountId, messageId);

// Download raw EML
const eml = await client.messages.getSource(accountId, messageId);

// Download attachment
const file = await client.messages.getAttachment(accountId, messageId, 0);

// Mark as read
await client.messages.markAsRead(accountId, messageId);
await client.messages.batchMarkAsRead(accountId, { all: true });

// Delete
await client.messages.delete(accountId, messageId);
```

### Domains (Pro)

```typescript
const domains = await client.domains.list();
const result = await client.domains.create('example.com');
console.log(result.dns_records); // DNS records to configure
const status = await client.domains.verify(result.id);
await client.domains.delete(result.id);
```

### Webhooks (Pro)

```typescript
const webhook = await client.webhooks.create({
  url: 'https://example.com/webhook',
  events: ['email.received'],
});
console.log(webhook.secret); // whsec_...

const deliveries = await client.webhooks.listDeliveries(webhook.id);
const { secret } = await client.webhooks.rotateSecret(webhook.id);
await client.webhooks.delete(webhook.id);
```

### Tokens (Pro)

```typescript
const { token } = await client.tokens.create('CI Token');
const tokens = await client.tokens.list();
await client.tokens.revoke(tokenId);
```

### Billing (Pro)

```typescript
const status = await client.billing.getStatus();
await client.billing.cancel();
await client.billing.resume();
const portalUrl = await client.billing.getPortalUrl();
```

### User (Pro)

```typescript
const me = await client.user.getMe();
const accounts = await client.user.listAccounts();
await client.user.deleteAccount(accountId);
await client.user.resetAccountPassword(accountId, { password: 'newpass' });
const { messages } = await client.user.listAccountMessages(accountId);
```

## Error Handling

```typescript
import { MailTD, APIError } from 'mailtd';

try {
  await client.accounts.create('taken@mail.td', { password: '...' });
} catch (err) {
  if (err instanceof APIError) {
    console.log(err.status); // 409
    console.log(err.code);   // "address_taken"
  }
}
```

## Links

- [Website](https://mail.td) — Temp mail & temporary email with REST API
- [API Documentation](https://docs.mail.td) — Full API reference
- [Python SDK](https://pypi.org/project/mailtd/) — `pip install mailtd`
- [Go SDK](https://github.com/mailtd/mailtd-go) — `go get github.com/mailtd/mailtd-go`
- [CLI](https://github.com/mailtd/mailcx-cli) — Command-line tool

## License

MIT
