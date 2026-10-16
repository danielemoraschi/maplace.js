import { onTestFinished } from "vitest";
import { gitIn } from "./git.ts";
import { newTempDir, removeTempDir } from "./temp-dir.ts";

/** Git in a test's repo, with no dependence on the machine's own git config. */
export function testGit(repo: string, ...args: string[]): string {
  const identity = ["-c", "user.name=Test", "-c", "user.email=test@example.com"];
  const unsigned = ["-c", "commit.gpgsign=false", "-c", "tag.gpgsign=false"];
  return gitIn(repo, [...identity, ...unsigned, ...args]);
}

/** A new, empty repo in a temp dir, removed once the test that made it finished. */
export function newTestRepo(prefix: string): string {
  const repo = newTempDir(prefix);
  onTestFinished(() => removeTempDir(repo));
  testGit(repo, "init", "-q");
  return repo;
}

/** Commits everything in `repo` as it is, even nothing. */
export function commitAll(repo: string, message: string): void {
  testGit(repo, "add", "-A");
  testGit(repo, "commit", "--allow-empty", "-q", "-m", message);
}
