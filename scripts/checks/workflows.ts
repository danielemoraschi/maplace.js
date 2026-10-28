import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseDocument } from "yaml";
import { ROOT } from "../build/package.ts";

const WORKFLOWS_DIR = ".github/workflows";

/**
 * Each workflow that doesn't parse as YAML, by file, line and column. GitHub runs no job of a workflow it
 * can't parse, and says so only on the run's page.
 */
export function check(root: string = ROOT): string[] {
  const dir = join(root, WORKFLOWS_DIR);
  return readdirSync(dir)
    .filter((file) => /\.ya?ml$/.test(file))
    .flatMap((file) =>
      parseDocument(readFileSync(join(dir, file), "utf8")).errors.map(
        // The message's first line names the line and column; the rest quotes the source.
        ({ message }) => `${WORKFLOWS_DIR}/${file}: ${message.split("\n")[0]}`,
      ),
    );
}
