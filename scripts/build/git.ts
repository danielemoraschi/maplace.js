import { execFileSync } from "node:child_process";
import { installedGit } from "./installed-tool.ts";

/** The installed git in `repo`, with fixed arguments and no shell. */
export function gitIn(repo: string, args: readonly string[]): string {
  return execFileSync(installedGit(), args, { cwd: repo, encoding: "utf8" });
}

/** A command's output as its lines, without the blank ones (the newline git and gh end with). */
export function outputLines(output: string): string[] {
  return output.split("\n").filter((line) => line !== "");
}

/** The commit `repo` has checked out. */
export function headCommit(repo: string): string {
  return gitIn(repo, ["rev-parse", "HEAD"]).trim();
}
