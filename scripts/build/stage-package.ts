import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { CHANGELOG_FILE } from "../docs/changelog-lines.ts";
import { withAbsoluteImages, withAbsoluteLinks } from "../docs/markdown.ts";
import { blobBaseFor, rawBaseFor } from "../release/repository.ts";
import { tagOf } from "../release/tags.ts";
import { withPinnedScripts } from "./cdn-pins.ts";
import {
  DIST,
  PACKED,
  packageManifest,
  ROOT,
  readRootFile,
  type VersionedManifest,
} from "./package.ts";
import { packedManifest } from "./packed-manifest.ts";
import { integrityOfFile } from "./subresource-integrity.ts";

/** Writes the package as npm packs it into `dir`: its packed manifest, `dist`, README, licence, notice and changelog. */
export function stagePackage(dir: string = PACKED, dist: string = DIST): void {
  const staged = resolve(ROOT, dir);
  rmSync(staged, { recursive: true, force: true });
  mkdirSync(staged, { recursive: true });
  const source = packageManifest();
  const manifest = packedManifest(source);
  writeFileSync(join(staged, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  cpSync(resolve(ROOT, dist), join(staged, "dist"), { recursive: true });
  for (const file of ["LICENSE", "NOTICE"]) cpSync(resolve(ROOT, file), join(staged, file));
  writeFileSync(join(staged, "README.md"), stagedReadme(source, resolve(ROOT, dist)));
  writeFileSync(join(staged, CHANGELOG_FILE), stagedChangelog(source));
}

/** The README pinned to this version's scripts, its links and images absolute at the tag. */
function stagedReadme(source: VersionedManifest, dist: string): string {
  const pinned = withPinnedScripts(readRootFile("README.md"), {
    version: source.version,
    integrityOf: (file) => integrityOfFile(join(dist, file)),
  });
  const withLinks = withAbsoluteLinks(pinned, blobBaseAt(source));
  return withAbsoluteImages(withLinks, rawBaseFor(source, tagOf(source.version)));
}

/** The changelog, its links to the repo absolute at the tag: the repo's files aren't packed. */
function stagedChangelog(source: VersionedManifest): string {
  return withAbsoluteLinks(readRootFile(CHANGELOG_FILE), blobBaseAt(source));
}

/** Where the repo's files are at this version's tag. */
function blobBaseAt(source: VersionedManifest): string {
  return blobBaseFor(source, tagOf(source.version));
}
