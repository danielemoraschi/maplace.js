import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

/** The Subresource Integrity value of `bytes`: what a `<script integrity>` checks. */
export function integrityOf(bytes: Uint8Array): string {
  return `sha384-${createHash("sha384").update(bytes).digest("base64")}`;
}

/** The integrity of the built file at `path`. */
export function integrityOfFile(path: string): string {
  if (!existsSync(path)) throw new Error(`${path} wasn't built, so it has no integrity hash`);
  return integrityOf(readFileSync(path));
}
