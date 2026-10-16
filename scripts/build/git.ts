import { execFileSync } from "node:child_process";
import { installedGit } from "./installed-tool.ts";

/** The installed git in `repo`, with fixed arguments and no shell. */
export function gitIn(repo: string, args: readonly string[]): string {
  return execFileSync(installedGit(), args, { cwd: repo, encoding: "utf8" });
}
