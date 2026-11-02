import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { tempDir } from "../build/temp-dir.ts";
import { check } from "./github-yaml.ts";

it("passes the repo's own workflows and issue forms", () => {
  expect(check()).toEqual([]);
});

it.each([".github", ".github/workflows", ".github/ISSUE_TEMPLATE"])(
  "names a file in %s that doesn't parse, by file and line",
  (dir) => {
    const root = tempDir("github-yaml");
    mkdirSync(join(root, dir), { recursive: true });
    writeFileSync(join(root, dir, "ok.yml"), "on: push\n");
    writeFileSync(
      join(root, dir, "bad.yml"),
      "jobs:\n  a:\n    steps:\n      - run: printf 'X-Robots-Tag: noindex'\n",
    );
    expect(check(root)).toEqual([
      `${dir}/bad.yml: Nested mappings are not allowed in compact mappings at line 4, column 14:`,
    ]);
  },
);
