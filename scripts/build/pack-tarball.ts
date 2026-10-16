import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * npm's own CLI, installed beside the Node running this (Unix and Windows layouts): never looked
 * up on `PATH`.
 */
const NPM_CLI_PLACES = ["../lib/node_modules", "node_modules"].map((modules) =>
  join(dirname(process.execPath), modules, "npm/bin/npm-cli.js"),
);

interface PackResult {
  readonly filename: string;
}

/** Packs the staged package `stagedDir` as npm publishes it into `outdir`; the tarball's path. */
export function packTarball(stagedDir: string, outdir: string): string {
  const args = ["pack", "--json", "--ignore-scripts", "--pack-destination", outdir];
  const output = execFileSync(process.execPath, [installedNpmCli(), ...args], {
    cwd: stagedDir,
    encoding: "utf8",
  });
  const [packed] = JSON.parse(output) as PackResult[];
  if (packed === undefined) throw new Error(`npm pack wrote nothing for ${stagedDir}`);
  return join(outdir, packed.filename);
}

function installedNpmCli(): string {
  const npmCli = NPM_CLI_PLACES.find((place) => existsSync(place));
  if (npmCli === undefined)
    throw new Error(`no npm beside this Node: ${NPM_CLI_PLACES.join(", ")}`);
  return npmCli;
}
