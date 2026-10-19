import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll } from "vitest";
import { CDN_SCRIPTS } from "./cdn-builds.ts";
import { buildEsm } from "./esm-build.ts";
import type { VersionedManifest } from "./package.ts";
import { stagePackage } from "./stage-package.ts";
import { tempDir } from "./temp-dir.ts";

interface StagedTestPackage {
  /** A consumer's directory, the package installed in its `node_modules`. */
  readonly consumerDir: string;
  /** The package as npm packs it. */
  readonly packageDir: string;
  /** The packed manifest, as staged. */
  readonly manifest: () => VersionedManifest;
}

/**
 * The npm ESM build staged as npm packs it, installed in a temp consumer before the test file's
 * tests run and removed after them.
 */
export function stagedBeforeTests(prefix: string): StagedTestPackage {
  const consumerDir = tempDir(prefix);
  const packageDir = join(consumerDir, "node_modules", "maplace");
  beforeAll(() => {
    const dist = join(consumerDir, "dist");
    buildEsm(dist);
    // Staging pins the README to the CDN scripts' bytes, whatever they are (cdn-builds.test.ts builds them).
    for (const file of Object.values(CDN_SCRIPTS)) writeFileSync(join(dist, file), `/* ${file} */`);
    stagePackage(packageDir, dist);
  });
  return {
    consumerDir,
    packageDir,
    manifest: () => JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8")),
  };
}
