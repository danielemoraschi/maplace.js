import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as pause } from "node:timers/promises";

/** How often a task waiting for the lock tries again. */
const RETRY_MS = 100;

/** How long a lock may go without its holder's id before it counts as abandoned. */
const UNNAMED_HOLDER_MS = 10_000;

/**
 * `task`, run while holding the lock at `path` (a directory, made atomically), so that tasks in
 * any process sharing `path` run one at a time. Two Astro builds of the site at once share its
 * `.astro` directory and its content store, and one comes out broken or fails.
 */
export async function withLock<T>(path: string, task: () => Promise<T>): Promise<T> {
  while (!tryLock(path)) await pause(RETRY_MS);
  try {
    return await task();
  } finally {
    rmSync(path, { recursive: true, force: true });
  }
}

function tryLock(path: string): boolean {
  try {
    mkdirSync(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    if (holderEnded(path)) rmSync(path, { recursive: true, force: true });
    return false;
  }
  writeFileSync(holderFile(path), String(process.pid));
  return true;
}

/**
 * The lock's holder ended without freeing it: a test run stopped mid-build, or stopped between
 * taking the lock and naming itself in it.
 */
function holderEnded(path: string): boolean {
  const pid = holderOf(path);
  return pid === undefined ? isUnnamedFor(path, UNNAMED_HOLDER_MS) : !isRunning(pid);
}

/** The holder's process id, unless the lock is being taken right now and has none yet. */
function holderOf(path: string): number | undefined {
  try {
    const pid = Number(readFileSync(holderFile(path), "utf8"));
    return Number.isInteger(pid) && pid > 0 ? pid : undefined;
  } catch {
    return undefined;
  }
}

/** The lock has had no holder's id for longer than `ms`. */
function isUnnamedFor(path: string, ms: number): boolean {
  try {
    return Date.now() - statSync(path).mtimeMs > ms;
  } catch {
    return false;
  }
}

function isRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

function holderFile(path: string): string {
  return join(path, "pid");
}
