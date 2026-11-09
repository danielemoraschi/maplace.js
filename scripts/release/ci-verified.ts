import { outputLines } from "../build/git.ts";

/** The GitHub CLI with fixed arguments: its output. */
export type Gh = (args: readonly string[]) => string;

/** CI's job whose passing is what CI's gates mean (ci.yml). */
const VERIFY_JOB = "verify";

/**
 * Whether CI's `verify` passed on `commit` in a run on `main` of `repo`: a branch's run, or a fork's
 * pull request from its own `main`, skips the billed tests (ci.yml), so neither counts. A `gh`
 * failure throws: an answer it couldn't get is no "no".
 */
export function verifiedOnMain(gh: Gh, repo: string, commit: string): boolean {
  const runs = gh([
    "run",
    "list",
    "--repo",
    repo,
    "--workflow",
    "ci.yml",
    "--branch",
    "main",
    "--commit",
    commit,
    "--json",
    "databaseId,event",
    "--jq",
    '.[] | select(.event != "pull_request") | .databaseId',
  ]);
  return outputLines(runs).some((run) => {
    const jobs = gh(["run", "view", run, "--repo", repo, "--json", "jobs", "--jq", JOB_PASSED]);
    return jobs.trim() === "true";
  });
}

const JOB_PASSED = `any(.jobs[]; .name == "${VERIFY_JOB}" and .conclusion == "success")`;
