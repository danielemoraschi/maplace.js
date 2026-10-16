import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll } from "vitest";

/** A new directory in `parent` for a test file's build, removed once its tests ran. */
export function tempDir(prefix: string, parent: string = tmpdir()): string {
  mkdirSync(parent, { recursive: true });
  const dir = mkdtempSync(join(parent, `maplace-${prefix}-`));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
