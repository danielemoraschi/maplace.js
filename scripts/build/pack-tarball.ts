import { execFileSync } from "node:child_process";
import { join } from "node:path";

interface PackResult {
  readonly filename: string;
}

/** Packs the staged package `stagedDir` as npm publishes it into `outdir`; the tarball's path. */
export function packTarball(stagedDir: string, outdir: string): string {
  const output = execFileSync(
    "npm",
    ["pack", "--json", "--ignore-scripts", "--pack-destination", outdir],
    {
      cwd: stagedDir,
      encoding: "utf8",
    },
  );
  const [packed] = JSON.parse(output) as PackResult[];
  if (packed === undefined) throw new Error(`npm pack wrote nothing for ${stagedDir}`);
  return join(outdir, packed.filename);
}
