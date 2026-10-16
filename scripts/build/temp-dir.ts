import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll } from "vitest";

/** A new directory for a test file's build, removed once its tests ran. */
export function tempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), `maplace-${prefix}-`));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
