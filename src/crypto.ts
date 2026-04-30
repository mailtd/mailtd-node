import { argon2id, sha256 } from "hash-wasm";

/**
 * Derives a 64-char hex auth_key from address and password using Argon2id.
 *
 * Parameters match the Mail.td web frontend and backend exactly:
 *   auth_key = Argon2id(password,
 *                       salt = SHA256(lower(trim(address))),
 *                       iterations=3, memorySize=16384 KiB,
 *                       parallelism=1, hashLength=32 bytes)
 *
 * SDK methods that accept `password` derive the auth_key locally with this
 * function so the password never leaves the client process.
 */
export async function deriveAuthKey(
  address: string,
  password: string
): Promise<string> {
  const salt = await sha256(address.toLowerCase().trim());
  const saltBytes = hexToBytes(salt);
  return argon2id({
    password,
    salt: saltBytes,
    parallelism: 1,
    iterations: 3,
    memorySize: 16384,
    hashLength: 32,
    outputType: "hex",
  });
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Builds the request body for the password-reset endpoints. Shared by
 * Accounts.resetPassword and User.resetAccountPassword.
 *
 * - If `authKey` is provided, it is sent as-is.
 * - Else if `password` is provided, the auth_key is derived locally; this
 *   needs the mailbox's email address as Argon2 salt — taken from `address`,
 *   or from `accountId` if it looks like an email.
 * - The returned body never contains a `password` field.
 */
export async function buildResetPasswordBody(
  accountId: string,
  options: { password?: string; authKey?: string; address?: string }
): Promise<Record<string, unknown>> {
  if (options.authKey != null) {
    return { auth_key: options.authKey };
  }
  if (options.password != null) {
    const addr =
      options.address && options.address.length > 0
        ? options.address
        : accountId.includes("@")
          ? accountId
          : null;
    if (!addr) {
      throw new Error(
        "mailtd: options.address is required when accountId is a UUID and password is used"
      );
    }
    return { auth_key: await deriveAuthKey(addr, options.password) };
  }
  return {};
}
