import { gitIn } from "./build/git.ts";
import { ROOT } from "./build/package.ts";
import { needsRealMaps } from "./checks/real-maps.ts";

/**
 * CI's step before `npm test` on `next`: `run=true` or `run=false` for `$GITHUB_OUTPUT`, whether
 * the commits since `base` (the last commit CI passed on `next`, none for a run started by hand)
 * need Google's real maps.
 */
function decide(base: string): void {
  const changed = changedSince(base);
  const run = needsRealMaps(changed);
  if (changed === undefined) console.error("real maps: what changed can't be told, so they run");
  else
    console.error(
      `real maps: ${run ? "run" : "skipped"}, ${changed.length} files changed since ${base}`,
    );
  console.log(`run=${run}`);
}

/** The files changed from `base` to HEAD; none told without a `base` git has to diff from. */
function changedSince(base: string): string[] | undefined {
  if (base === "") return undefined;
  try {
    const names = gitIn(ROOT, ["diff", "--name-only", base, "HEAD"]);
    return names.split("\n").filter((name) => name !== "");
  } catch (error) {
    // A base the checkout lacks (a rewritten history): what changed can't be told.
    console.error(
      `real maps: no diff from ${base}:`,
      error instanceof Error ? error.message : error,
    );
    return undefined;
  }
}

decide(process.argv[2] ?? "");
