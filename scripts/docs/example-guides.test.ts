import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { exampleGuideFiles } from "./example-guides.ts";

let root: string | undefined;
afterEach(() => root && rmSync(root, { recursive: true, force: true }));

/** A repo whose examples are `names`, those in `guided` with a guide. */
function repoWith(names: string[], guided: string[]): string {
  root = mkdtempSync(join(tmpdir(), "guides-"));
  for (const name of names) {
    const dir = join(root, "packages/maplace/examples", name);
    mkdirSync(dir, { recursive: true });
    if (guided.includes(name)) writeFileSync(join(dir, "guide.md"), "# Guide\n");
  }
  return root;
}

describe("exampleGuideFiles", () => {
  it("is each example with a guide, by its folder's name, and none without one", () => {
    expect(exampleGuideFiles(repoWith(["menu", "custom-list"], ["custom-list"]))).toEqual([
      { name: "custom-list", file: "packages/maplace/examples/custom-list/guide.md" },
    ]);
  });
});
