import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DIST, PACKED, packageManifest, ROOT } from "./package.ts";
import { packedManifest } from "./packed-manifest.ts";

/** Files from the repo root packed beside `dist`. */
const ROOT_FILES = ["README.md", "LICENSE"];

/** Writes the package as npm packs it into `dir`: its packed manifest, `dist`, README and licence. */
export function stagePackage(dir: string = PACKED, dist: string = DIST): void {
  const staged = resolve(ROOT, dir);
  rmSync(staged, { recursive: true, force: true });
  mkdirSync(staged, { recursive: true });
  const manifest = packedManifest(packageManifest());
  writeFileSync(join(staged, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  cpSync(resolve(ROOT, dist), join(staged, "dist"), { recursive: true });
  for (const file of ROOT_FILES) cpSync(resolve(ROOT, file), join(staged, file));
}
