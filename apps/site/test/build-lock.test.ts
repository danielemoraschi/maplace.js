import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as pause } from "node:timers/promises";
import { describe, expect, it } from "vitest";
import { tempDir } from "../../../scripts/build/temp-dir.ts";
import { withLock } from "./build-lock.ts";

/** A lock at `path` held by the process `pid`, as `withLock` leaves it while its task runs. */
function lockHeldBy(path: string, pid: number): void {
  mkdirSync(path);
  writeFileSync(join(path, "pid"), String(pid));
}

describe("withLock", () => {
  const dir = tempDir("build-lock");

  it("runs one task at a time, the next once the first is done", async () => {
    const lock = join(dir, "one-at-a-time");
    const events: string[] = [];
    const task = (name: string) => async () => {
      events.push(`${name} starts`);
      await pause(50);
      events.push(`${name} ends`);
      return name;
    };
    const results = await Promise.all([withLock(lock, task("a")), withLock(lock, task("b"))]);
    expect(results).toEqual(["a", "b"]);
    expect(events).toEqual(["a starts", "a ends", "b starts", "b ends"]);
  });

  it("frees the lock when the task throws", async () => {
    const lock = join(dir, "throws");
    const failing = withLock(lock, () => Promise.reject(new Error("the build failed")));
    await expect(failing).rejects.toThrow("the build failed");
    expect(await withLock(lock, async () => "next")).toBe("next");
  });

  it("takes over a lock whose process ended without freeing it", async () => {
    const lock = join(dir, "ended");
    const { pid } = spawnSync(process.execPath, ["--version"]);
    lockHeldBy(lock, pid);
    expect(await withLock(lock, async () => "taken")).toBe("taken");
  });

  it("takes over a lock left without its holder's id a while ago", async () => {
    const lock = join(dir, "no-holder");
    mkdirSync(lock);
    const longAgo = new Date(Date.now() - 60_000);
    utimesSync(lock, longAgo, longAgo);
    const taken = withLock(lock, async () => "taken");
    expect(await Promise.race([taken, pause(1_000, "waits")])).toBe("taken");
  });

  it("waits for a lock whose process still runs, however long it has held it", async () => {
    const lock = join(dir, "running");
    lockHeldBy(lock, process.ppid);
    const longAgo = new Date(Date.now() - 60 * 60_000);
    utimesSync(lock, longAgo, longAgo);
    const waiting = withLock(lock, async () => "taken");
    expect(await Promise.race([waiting, pause(300, "waits")])).toBe("waits");
    rmSync(lock, { recursive: true });
    expect(await waiting).toBe("taken");
  });
});
