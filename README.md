# mailtd

Official Node.js SDK for the [Mail.td](https://mail.td) developer email platform.

## Install

```bash
npm install mailtd
```

Requires Node.js 18+.

## Quick Start

```typescript
import { MailTD } from 'mailtd';

const client = new MailTD('td_...');

// Create a mailbox
const account = await client.accounts.create('test@mail.td', {
  password: 'mypassword',
});

// List messages
const { messages } = await client.messages.list(account.id);

// Get a message
const message = await client.messages.get(account.id, messages[0].id);
console.log(message.subject, message.text_body);
```

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

### Sandbox (Pro)

```typescript
const info = await client.sandbox.getInfo();
console.log(`SMTP: ${info.smtp_host}:${info.smtp_port}`);

const { messages } = await client.sandbox.listMessages();
const msg = await client.sandbox.getMessage(messageId);
await client.sandbox.purgeMessages();
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

## License

MIT
