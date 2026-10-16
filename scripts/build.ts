import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { buildCdnScripts } from "./build/cdn-builds.ts";
import { emitDeclarations } from "./build/declarations.ts";
import { buildEsm } from "./build/esm-build.ts";
import { DIST, PACKED, ROOT } from "./build/package.ts";
import { stagePackage } from "./build/stage-package.ts";

/** `npm run build`: `dist` (npm ESM, declarations, the CDN scripts), then the package as npm packs it. */
async function buildPackage(): Promise<void> {
  rmSync(resolve(ROOT, DIST), { recursive: true, force: true });
  buildEsm();
  emitDeclarations();
  await buildCdnScripts();
  stagePackage();
  console.log(`Built ${DIST}, staged ${PACKED}.`);
}

await buildPackage();
