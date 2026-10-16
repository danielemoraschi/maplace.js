import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { CHANGELOG_FILE } from "../checks/changelog-lines.ts";
import { withAbsoluteLinks } from "../checks/markdown.ts";
import { blobBaseFor } from "../release/repository.ts";
import { tagOf } from "../release/tags.ts";
import { withPinnedScripts } from "./cdn-pins.ts";
import { DIST, PACKED, packageManifest, ROOT } from "./package.ts";
import { packedManifest } from "./packed-manifest.ts";
import { integrityOfFile } from "./subresource-integrity.ts";

type SourceManifest = ReturnType<typeof packageManifest>;

/** Writes the package as npm packs it into `dir`: its packed manifest, `dist`, README, licence and changelog. */
export function stagePackage(dir: string = PACKED, dist: string = DIST): void {
  const staged = resolve(ROOT, dir);
  rmSync(staged, { recursive: true, force: true });
  mkdirSync(staged, { recursive: true });
  const source = packageManifest();
  const manifest = packedManifest(source);
  writeFileSync(join(staged, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  cpSync(resolve(ROOT, dist), join(staged, "dist"), { recursive: true });
  cpSync(resolve(ROOT, "LICENSE"), join(staged, "LICENSE"));
  writeFileSync(join(staged, "README.md"), stagedReadme(source, resolve(ROOT, dist)));
  writeFileSync(join(staged, CHANGELOG_FILE), stagedChangelog(source));
}

/** The README pinned to this version's scripts, its links to the repo absolute at the tag. */
function stagedReadme(source: SourceManifest, dist: string): string {
  const pinned = withPinnedScripts(readRootFile("README.md"), {
    version: source.version,
    integrityOf: (file) => integrityOfFile(join(dist, file)),
  });
  return withAbsoluteLinks(pinned, blobBaseAt(source));
}

/** The changelog, its links to the repo absolute at the tag: the repo's files aren't packed. */
function stagedChangelog(source: SourceManifest): string {
  return withAbsoluteLinks(readRootFile(CHANGELOG_FILE), blobBaseAt(source));
}

/** Where the repo's files are at this version's tag. */
function blobBaseAt(source: SourceManifest): string {
  return blobBaseFor(source, tagOf(source.version));
}

function readRootFile(name: string): string {
  return readFileSync(resolve(ROOT, name), "utf8");
}
