import { createHash } from "node:crypto";
import type { PoWSolution } from "./types.js";

const DEFAULT_DIFFICULTY = 15;

function hasLeadingZeroBits(hash: Buffer, bits: number): boolean {
  let remaining = bits;
  for (const byte of hash) {
    if (remaining <= 0) return true;
    if (remaining >= 8) {
      if (byte !== 0) return false;
      remaining -= 8;
    } else {
      if (byte >> (8 - remaining) !== 0) return false;
      return true;
    }
  }
  return remaining <= 0;
}

export function solvePow(
  address: string,
  difficulty: number = DEFAULT_DIFFICULTY
): PoWSolution {
  const t = Math.floor(Date.now() / 1000);
  let nonce = 0;

  while (true) {
    const input = address + t + nonce;
    const hash = createHash("sha256").update(input).digest();
    if (hasLeadingZeroBits(hash, difficulty)) {
      return { t, n: String(nonce), d: difficulty };
    }
    nonce++;
  }
}
