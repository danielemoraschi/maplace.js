import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll } from "vitest";

/** A new directory in `parent` for a test file's build, removed once its tests ran. */
export function tempDir(prefix: string, parent: string = tmpdir()): string {
  const dir = newTempDir(prefix, parent);
  afterAll(() => removeTempDir(dir));
  return dir;
}

/** A new directory in `parent`, for the caller to remove (`removeTempDir`). */
export function newTempDir(prefix: string, parent: string = tmpdir()): string {
  mkdirSync(parent, { recursive: true });
  return mkdtempSync(join(parent, `maplace-${prefix}-`));
}

export function removeTempDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}
