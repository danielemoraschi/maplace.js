import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseDocument } from "yaml";
import { ROOT } from "../build/package.ts";

const GITHUB_YAML = ".github/**/*.{yml,yaml}";

/**
 * Each YAML file under `.github/` that doesn't parse, by file, line and column. GitHub runs no job of a
 * workflow it can't parse, saying so only on the run's page, and offers no form it can't parse.
 */
export function check(root: string = ROOT): string[] {
  return globSync(GITHUB_YAML, { cwd: root }).flatMap((file) =>
    parseDocument(readFileSync(join(root, file), "utf8")).errors.map(
      // The message's first line names the line and column; the rest quotes the source.
      ({ message }) => `${file}: ${message.split("\n")[0]}`,
    ),
  );
}
