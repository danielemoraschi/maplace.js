import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { withAbsoluteLinks } from "../release/changelog-release.ts";
import { blobBaseFor } from "../release/repository.ts";
import { tagOf } from "../release/tags.ts";
import { DIST, PACKED, packageManifest, ROOT } from "./package.ts";
import { packedManifest } from "./packed-manifest.ts";

/** Files from the repo root packed beside `dist`, as they are. */
const ROOT_FILES = ["README.md", "LICENSE"];

/** Writes the package as npm packs it into `dir`: its packed manifest, `dist`, README, licence and changelog. */
export function stagePackage(dir: string = PACKED, dist: string = DIST): void {
  const staged = resolve(ROOT, dir);
  rmSync(staged, { recursive: true, force: true });
  mkdirSync(staged, { recursive: true });
  const source = packageManifest();
  const manifest = packedManifest(source);
  writeFileSync(join(staged, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  cpSync(resolve(ROOT, dist), join(staged, "dist"), { recursive: true });
  for (const file of ROOT_FILES) cpSync(resolve(ROOT, file), join(staged, file));
  // The repo's files the changelog links to aren't packed: its links go to them at the tag.
  const changelog = readFileSync(resolve(ROOT, "CHANGELOG.md"), "utf8");
  const blobBase = blobBaseFor(source, tagOf(source.version));
  writeFileSync(join(staged, "CHANGELOG.md"), withAbsoluteLinks(changelog, blobBase));
}
