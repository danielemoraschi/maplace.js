import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../build/package.ts";
import { issuesClosedBy, issuesNamedIn, listLines, undatedLines } from "./changelog-lines.ts";

const CHANGELOG = "CHANGELOG.md";

interface Commit {
  readonly sha: string;
  readonly message: string;
}

/**
 * Each commit since CHANGELOG.md was created that closes an issue no line names, and
 * each line without its date. The history before the file is not judged.
 */
export function check(repo: string = ROOT): string[] {
  const path = join(repo, CHANGELOG);
  if (!existsSync(path)) return [];
  const changelog = readFileSync(path, "utf8");
  // Any line counts: a release later puts its heading above the lines it ships.
  const named = issuesNamedIn(listLines(changelog));
  const baseline = changelogBaseline(repo);
  const commits = baseline === undefined ? [] : commitsAfter(repo, baseline);
  return [
    ...commits.flatMap(({ sha, message }) =>
      issuesClosedBy(message)
        .filter((issue) => !named.has(issue))
        .map((issue) => `${sha} closes #${issue}, which no line of ${CHANGELOG} names`),
    ),
    ...undatedLines(changelog).map((line) => `${CHANGELOG} ${line} has no date`),
  ];
}

/** The commit that created CHANGELOG.md, if one did. */
function changelogBaseline(repo: string): string | undefined {
  const added = gitIn(repo, ["log", "--diff-filter=A", "--format=%H", "--", CHANGELOG]);
  return added
    .trim()
    .split("\n")
    .findLast((sha) => sha !== "");
}

/** The commits after `baseline`, oldest first, each message whole. */
function commitsAfter(repo: string, baseline: string): Commit[] {
  // Each commit as `sha NUL message RS`: a message may hold any line, never these two.
  const log = gitIn(repo, ["log", "--reverse", "--format=%h%x00%B%x1e", `${baseline}..HEAD`]);
  return log
    .split("\x1e")
    .filter((record) => record.includes("\0"))
    .map((record) => {
      const [sha = "", message = ""] = record.split("\0");
      return { sha: sha.trim(), message };
    });
}

/** Git with fixed arguments and no shell: a repo check run by developers and CI. */
function gitIn(repo: string, args: readonly string[]): string {
  return execFileSync("git", args, { cwd: repo, encoding: "utf8" });
}
