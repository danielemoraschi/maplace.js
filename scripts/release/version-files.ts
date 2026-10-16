import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PACKAGE_DIR, SRC } from "../build/package.ts";

/** A file holding the package's version, and the one place in it the version is. */
export interface VersionFile {
  readonly path: string;
  /** Matches the version's place: the text before it in group 1, the quoted version after. */
  readonly pattern: RegExp;
}

/**
 * Edited as text, not parsed and re-serialised, so each file keeps its formatting byte for
 * byte; a test holds each pattern to the repo's file.
 */
export const VERSION_FILES: readonly VersionFile[] = [
  // The manifest's own version: the one key at two spaces' indent.
  { path: `${PACKAGE_DIR}/package.json`, pattern: /^( {2}"version": )"[^"]*"/gm },
  // The workspace's entry in the lockfile, which `npm ci` holds to the manifest.
  {
    path: "package-lock.json",
    pattern: new RegExp(String.raw`("${PACKAGE_DIR}": \{\s*"version": )"[^"]*"`, "g"),
  },
  // The version the element names when another copy already defined it.
  { path: `${SRC}/element/version.ts`, pattern: /(export const MAPLACE_VERSION = )"[^"]*"/g },
];

interface VersionChange {
  readonly file: VersionFile;
  readonly version: string;
}

/** `text` with `version` in the file's one place for it; throws unless the place is found once. */
export function withVersion(text: string, { file, version }: VersionChange): string {
  const found = [...text.matchAll(file.pattern)].length;
  if (found !== 1) throw new Error(`${file.path}: found the version ${found} times, not once`);
  return text.replace(file.pattern, `$1"${version}"`);
}

/** Writes `version` into each version file in `repo`, once all were found; the paths written. */
export function writeVersion(repo: string, version: string): string[] {
  const edits = VERSION_FILES.map((file) => {
    const path = join(repo, file.path);
    return { path, text: withVersion(readFileSync(path, "utf8"), { file, version }) };
  });
  for (const { path, text } of edits) writeFileSync(path, text);
  return VERSION_FILES.map(({ path }) => path);
}
