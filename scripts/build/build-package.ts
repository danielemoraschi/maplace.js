import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { buildCdnScripts } from "./cdn-builds.ts";
import { emitDeclarations } from "./declarations.ts";
import { buildEsm } from "./esm-build.ts";
import { DIST, PACKED, ROOT } from "./package.ts";
import { stagePackage } from "./stage-package.ts";

/** Where a build writes: `dist`, and the package staged as npm packs it. */
export interface BuildDirs {
  readonly dist: string;
  readonly packed: string;
}

/** The whole build: `dist` (npm ESM, declarations, the CDN scripts), then the package staged. */
export async function buildPackage({ dist, packed }: BuildDirs = { dist: DIST, packed: PACKED }) {
  rmSync(resolve(ROOT, dist), { recursive: true, force: true });
  buildEsm(dist);
  emitDeclarations(dist);
  await buildCdnScripts(dist);
  stagePackage(packed, dist);
}
