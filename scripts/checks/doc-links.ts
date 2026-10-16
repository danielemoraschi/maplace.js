import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { ROOT } from "../build/package.ts";
import { DOCS, relativeLinksIn } from "./markdown.ts";

/**
 * Each relative link in the docs that reaches no file or directory of the repo. Anchors aren't
 * checked: GitHub's heading slugs aren't worth copying.
 */
export function check(root: string = ROOT, docs: readonly string[] = DOCS): string[] {
  return docs.flatMap((doc) => {
    const markdown = readFileSync(join(root, doc), "utf8");
    return relativeLinksIn(markdown)
      .filter(({ path }) => !existsSync(join(root, dirname(doc), path)))
      .map(({ path, line }) => `${doc} line ${line}: ${path} doesn't exist`);
  });
}
