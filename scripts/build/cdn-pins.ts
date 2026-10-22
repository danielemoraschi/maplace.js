import { fencedBlocks } from "../docs/markdown.ts";

/** What pins a CDN script: a version, and each script's integrity. */
export interface Pin {
  readonly version: string;
  /** The integrity of a script in `dist`, by file name. */
  readonly integrityOf: (file: string) => string;
}

/**
 * The README's pinned CDN script, as written in the repo: `maplace@x.y.z/dist/<file>"`, then
 * on the next line `integrity="sha384-…"`. Group 1 is the file, group 2 what separates them.
 */
const PINNED_SCRIPT = /maplace@x\.y\.z\/dist\/([^"/]+)"(\s+)integrity="sha384-…"/g;

/** The scripts the README pins, by file name, as the repo writes it. */
export function pinnedScriptsIn(readme: string): string[] {
  return Array.from(readme.matchAll(PINNED_SCRIPT), ([, file]) => file ?? "");
}

/** The version as the repo's README writes it, wherever it names one. */
const ANY_VERSION = "maplace@x.y.z";

/**
 * The README with each pinned script given the version and that script's integrity, and every
 * other `maplace@x.y.z` the version.
 */
export function withPinnedScripts(readme: string, { version, integrityOf }: Pin): string {
  if (readme.search(PINNED_SCRIPT) === -1) {
    throw new Error(
      "README.md has no pinned script (maplace@x.y.z/dist/… with integrity) to fill in",
    );
  }
  return readme
    .replaceAll(
      PINNED_SCRIPT,
      (_, file: string, gap: string) =>
        `${ANY_VERSION}/dist/${file}"${gap}integrity="${integrityOf(file)}"`,
    )
    .replaceAll(ANY_VERSION, `maplace@${version}`);
}

/** The README's snippet that pins `file` (with its integrity), as the README writes it. */
export function pinnedSnippetOf(readme: string, file: string): string {
  const snippet = fencedBlocks(readme, "html").find(
    (body) => body.includes(`/dist/${file}"`) && body.includes("integrity="),
  );
  if (snippet === undefined) throw new Error(`README.md pins no ${file}`);
  return snippet;
}
