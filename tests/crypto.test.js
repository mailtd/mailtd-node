import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";

import { deriveAuthKey, buildResetPasswordBody } from "../dist/crypto.js";
import { MailTD } from "../dist/index.js";

// Vectors are computed by golang.org/x/crypto/argon2 with the same params
// (the Mail.td backend uses the exact same library). They were verified
// against the Go SDK in mailtd-go/crypto_test.go.
const VECTORS = [
  {
    address: "alice@mail.td",
    password: "password123",
    expected:
      "2d0b5b1cd63138ba6e5b13777000e55b5dcd8ab4286f16d2fdd3aae8948c6bcf",
  },
  {
    // Verifies salt = SHA256(lower(trim(address))).
    address: "BOB@mail.td  ",
    password: "P@ssw0rd!",
    expected:
      "5c35127b2175a8aadd1fbb16ccca66701d34b78f1f96e7caa51774159ac41060",
  },
];

test("deriveAuthKey: matches Go/backend known vectors", async () => {
  for (const { address, password, expected } of VECTORS) {
    const got = await deriveAuthKey(address, password);
    assert.equal(got, expected);
    assert.equal(got.length, 64);
  }
});

test("buildResetPasswordBody: authKey passes through", async () => {
  const ak = "a".repeat(64);
  const body = await buildResetPasswordBody("anything", { authKey: ak });
  assert.deepEqual(body, { auth_key: ak });
});

test("buildResetPasswordBody: password + email-id derives", async () => {
  const body = await buildResetPasswordBody("alice@mail.td", {
    password: "password123",
  });
  assert.equal(body.auth_key, VECTORS[0].expected);
  assert.equal(body.password, undefined);
});

test("buildResetPasswordBody: password + UUID without address throws", async () => {
  await assert.rejects(
    () =>
      buildResetPasswordBody("11111111-1111-1111-1111-111111111111", {
        password: "password123",
      }),
    /address is required/
  );
});

test("buildResetPasswordBody: password + UUID + address derives", async () => {
  const body = await buildResetPasswordBody(
    "11111111-1111-1111-1111-111111111111",
    { password: "password123", address: "alice@mail.td" }
  );
  assert.equal(body.auth_key, VECTORS[0].expected);
});

test("buildResetPasswordBody: authKey wins over password", async () => {
  const ak = "b".repeat(64);
  const body = await buildResetPasswordBody("alice@mail.td", {
    authKey: ak,
    password: "password123",
  });
  assert.deepEqual(body, { auth_key: ak });
});

// Spin up a tiny HTTP server that captures request bodies, point the SDK at
// it, and verify the wire-level body is correct.
async function captureServer() {
  const captured = { body: null };
  const server = createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      captured.body = raw ? JSON.parse(raw) : null;
      res.writeHead(req.url === "/api/accounts" && req.method === "POST" ? 200 : 204, {
        "Content-Type": "application/json",
      });
      if (req.url === "/api/accounts" && req.method === "POST") {
        res.end(
          JSON.stringify({
            id: "00000000-0000-0000-0000-000000000000",
            address: "alice@mail.td",
            token: "x",
          })
        );
      } else {
        res.end();
      }
    });
  });
  await new Promise((r) => server.listen(0, r));
  const { port } = server.address();
  return { captured, server, baseUrl: `http://127.0.0.1:${port}` };
}

test("Accounts.create: password derives locally, no password in body", async () => {
  const { captured, server, baseUrl } = await captureServer();
  try {
    const c = new MailTD({ token: "t", baseUrl });
    await c.accounts.create("alice@mail.td", { password: "password123" });
    assert.equal(captured.body.password, undefined);
    assert.equal(captured.body.auth_key, VECTORS[0].expected);
  } finally {
    server.close();
  }
});

test("Accounts.resetPassword: password + UUID + address path", async () => {
  const { captured, server, baseUrl } = await captureServer();
  try {
    const c = new MailTD({ token: "t", baseUrl });
    await c.accounts.resetPassword("11111111-1111-1111-1111-111111111111", {
      password: "password123",
      address: "alice@mail.td",
    });
    assert.equal(captured.body.auth_key, VECTORS[0].expected);
    assert.equal(captured.body.password, undefined);
  } finally {
    server.close();
  }
});

test("Accounts.login: derives password locally and POSTs /api/token", async () => {
  let captured = null;
  let pathSeen = "";
  let methodSeen = "";
  const server = createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      pathSeen = req.url;
      methodSeen = req.method;
      captured = raw ? JSON.parse(raw) : null;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          id: "00000000-0000-0000-0000-000000000000",
          address: "alice@mail.td",
          token: "jwt.x.y",
        })
      );
    });
  });
  await new Promise((r) => server.listen(0, r));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    const c = new MailTD({ baseUrl }); // no token — login should still work
    const out = await c.accounts.login("alice@mail.td", {
      password: "password123",
    });
    assert.equal(pathSeen, "/api/token");
    assert.equal(methodSeen, "POST");
    assert.equal(captured.address, "alice@mail.td");
    assert.equal(captured.auth_key, VECTORS[0].expected);
    assert.equal(captured.password, undefined);
    assert.equal(out.token, "jwt.x.y");
    assert.equal(out.id, "00000000-0000-0000-0000-000000000000");
  } finally {
    server.close();
  }
});

test("Accounts.login: authKey takes precedence over password", async () => {
  let captured = null;
  const server = createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      captured = JSON.parse(raw);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ id: "x", address: "alice@mail.td", token: "t" }));
    });
  });
  await new Promise((r) => server.listen(0, r));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    const c = new MailTD({ baseUrl });
    const ak = "a".repeat(64);
    await c.accounts.login("alice@mail.td", { authKey: ak, password: "ignored" });
    assert.equal(captured.auth_key, ak);
  } finally {
    server.close();
  }
});

test("Accounts.login: throws when neither credential is provided", async () => {
  const c = new MailTD({ baseUrl: "http://unused" });
  await assert.rejects(() => c.accounts.login("alice@mail.td", {}), /requires/);
});

test("User.resetAccountPassword: derives locally", async () => {
  const { captured, server, baseUrl } = await captureServer();
  try {
    const c = new MailTD({ token: "t", baseUrl });
    await c.user.resetAccountPassword("alice@mail.td", {
      password: "password123",
    });
    assert.equal(captured.body.auth_key, VECTORS[0].expected);
    assert.equal(captured.body.password, undefined);
  } finally {
    server.close();
  }
});
