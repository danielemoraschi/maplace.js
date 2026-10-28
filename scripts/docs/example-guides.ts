import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PACKAGE_DIR, ROOT } from "../build/package.ts";

/** The file beside an example's versions that says how it works; the site shows it. */
export const EXAMPLE_GUIDE_FILE = "guide.md";

const EXAMPLES_DIR = `${PACKAGE_DIR}/examples`;

/** An example's guide: the example's folder name and the guide's path in the repo. */
export interface ExampleGuideFile {
  readonly name: string;
  readonly file: string;
}

/** Each example with a guide, found on disk: the doc checks and the site read this one list. */
export function exampleGuideFiles(root: string = ROOT): ExampleGuideFile[] {
  return readdirSync(join(root, EXAMPLES_DIR), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map(({ name }) => ({ name, file: exampleGuideFile(name) }))
    .filter(({ file }) => existsSync(join(root, file)));
}

/** Where the example `name`'s guide is, or would be, in the repo. */
export function exampleGuideFile(name: string): string {
  return `${EXAMPLES_DIR}/${name}/${EXAMPLE_GUIDE_FILE}`;
}
