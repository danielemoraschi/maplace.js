import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { tempDir } from "../build/temp-dir.ts";
import { check } from "./doc-links.ts";

it("passes the repo's own docs", () => {
  expect(check()).toEqual([]);
});

it("names a link that reaches nothing, by document and line", () => {
  const root = tempDir("doc-links");
  mkdirSync(join(root, "docs"));
  writeFileSync(join(root, "README.md"), "# x\n\n[ok](docs/a.md) [gone](docs/b.md)\n");
  writeFileSync(join(root, "docs", "a.md"), "[back](../README.md) [up](../nope/)\n");
  expect(check(root, ["README.md", "docs/a.md"])).toEqual([
    "README.md line 3: docs/b.md doesn't exist",
    "docs/a.md line 1: ../nope/ doesn't exist",
  ]);
});
