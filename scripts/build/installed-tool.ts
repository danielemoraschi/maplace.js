import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Where git is installed on the systems that run the repo's checks: Linux and macOS system git,
 * Homebrew on Intel and Apple silicon, Git for Windows.
 */
const GIT_PLACES = [
  "/usr/bin/git",
  "/usr/local/bin/git",
  "/opt/homebrew/bin/git",
  String.raw`C:\Program Files\Git\cmd\git.exe`,
];

/** npm's own CLI, beside the Node running this, in the Unix and the Windows layout. */
const NPM_CLI_PLACES = ["../lib/node_modules", "node_modules"].map((modules) =>
  join(dirname(process.execPath), modules, "npm/bin/npm-cli.js"),
);

/** The installed git's absolute path: never looked up on `PATH`. */
export function installedGit(): string {
  return installedTool("git", GIT_PLACES);
}

/** The installed npm CLI's absolute path, to run with `process.execPath`: never looked up on `PATH`. */
export function installedNpmCli(): string {
  return installedTool("npm", NPM_CLI_PLACES);
}

function installedTool(name: string, places: readonly string[]): string {
  const found = places.find((place) => existsSync(place));
  if (found === undefined) throw new Error(`no ${name} at any of ${places.join(", ")}`);
  return found;
}
