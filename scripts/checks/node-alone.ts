import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { ROOT } from "../build/package.ts";
import { importsOf } from "./imports.ts";

/**
 * The scripts workflows run on Node alone, before or without an install: the deploy's choice and
 * offsite.yml's checks. A package anywhere in what they import would pass every test, as CI has
 * `node_modules`, and fail in the workflow.
 */
export const NODE_ALONE_SCRIPTS = [
  "scripts/deploy-target.ts",
  "scripts/security-txt-expiry.ts",
  "apps/site/src/site/offsite-check.ts",
];

/** A type-only import, which Node strips: it loads nothing. */
const TYPE_ONLY_IMPORT = /^import type [^;]+;$/gm;

/** Every package `entry` reaches through its relative imports, as `file: package`. */
export function packagesReachedFrom(entry: string): string[] {
  const visited = new Set<string>();
  const packages: string[] = [];
  const visit = (file: string) => {
    if (visited.has(file)) return;
    visited.add(file);
    const source = readFileSync(file, "utf8").replaceAll(TYPE_ONLY_IMPORT, "");
    for (const specifier of importsOf(source)) {
      if (specifier.startsWith(".")) visit(resolve(dirname(file), specifier));
      else if (!specifier.startsWith("node:"))
        packages.push(`${relative(ROOT, file)}: ${specifier}`);
    }
  };
  visit(resolve(ROOT, entry));
  return packages;
}
