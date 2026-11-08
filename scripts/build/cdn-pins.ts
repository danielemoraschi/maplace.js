import { fencedBlocks } from "../docs/markdown.ts";
import { PACKAGE_NAME } from "../release/published-package.ts";

/** What pins a CDN script: a version, and each script's integrity. */
export interface Pin {
  readonly version: string;
  /** The integrity of a script in `dist`, by file name. */
  readonly integrityOf: (file: string) => string;
}

/**
 * The README's pinned CDN script, as written in the repo: `<name>@x.y.z/dist/<file>"` after a
 * slash, then on the next line `integrity="sha384-…"`. Group 1 is the file, group 2 what
 * separates them. The slash is looked behind, not matched, so the filled URL keeps it.
 */
const PINNED_SCRIPT = new RegExp(
  String.raw`(?<=/)${PACKAGE_NAME}@x\.y\.z/dist/([^"/]+)"(\s+)integrity="sha384-…"`,
  "g",
);

/** The scripts the README pins, by file name, as the repo writes it. */
export function pinnedScriptsIn(readme: string): string[] {
  return Array.from(readme.matchAll(PINNED_SCRIPT), ([, file]) => file ?? "");
}

/** The version as the repo's README writes it, wherever it names one. */
const ANY_VERSION = `${PACKAGE_NAME}@x.y.z`;

/** What the repo's README holds until staging fills it in. */
const PLACEHOLDERS = ["@x.y.z", "sha384-…"];

/**
 * The README with each pinned script given the version and that script's integrity, and every
 * other `<name>@x.y.z` the version. Throws if a placeholder is left, as a URL naming another
 * package would leave it.
 */
export function withPinnedScripts(readme: string, { version, integrityOf }: Pin): string {
  if (readme.search(PINNED_SCRIPT) === -1) {
    throw new Error(
      `README.md has no pinned script (${ANY_VERSION}/dist/… with integrity) to fill in`,
    );
  }
  const filled = readme
    .replaceAll(
      PINNED_SCRIPT,
      (_, file: string, gap: string) =>
        `${ANY_VERSION}/dist/${file}"${gap}integrity="${integrityOf(file)}"`,
    )
    .replaceAll(ANY_VERSION, `${PACKAGE_NAME}@${version}`);
  const left = PLACEHOLDERS.find((placeholder) => filled.includes(placeholder));
  if (left !== undefined) {
    throw new Error(
      `README.md still holds ${left} after pinning: a CDN URL names another package?`,
    );
  }
  return filled;
}

const PUBLISHED_PIN = new RegExp(
  String.raw`(?<=/)${PACKAGE_NAME}@([^/"\s]+)/dist/([^"/]+)"\s+integrity="(sha384-[^"]+)"`,
  "g",
);

/** The inverse of `withPinnedScripts`: file name to integrity, in a published README, for `version`. */
export function pinnedIntegritiesIn(readme: string, version: string): ReadonlyMap<string, string> {
  const pins = Array.from(readme.matchAll(PUBLISHED_PIN));
  return new Map(
    pins
      .filter(([, pinned]) => pinned === version)
      .map(([, , file, integrity]) => [file as string, integrity as string]),
  );
}

/** The README's snippet that pins `file` (with its integrity), as the README writes it. */
export function pinnedSnippetOf(readme: string, file: string): string {
  const snippet = fencedBlocks(readme, "html").find(
    (body) => body.includes(`/dist/${file}"`) && body.includes("integrity="),
  );
  if (snippet === undefined) throw new Error(`README.md pins no ${file}`);
  return snippet;
}
