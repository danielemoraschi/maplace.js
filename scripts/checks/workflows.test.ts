import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { tempDir } from "../build/temp-dir.ts";
import { check } from "./workflows.ts";

it("passes the repo's own workflows", () => {
  expect(check()).toEqual([]);
});

it("names a workflow that doesn't parse, by file and line", () => {
  const root = tempDir("workflows");
  mkdirSync(join(root, ".github/workflows"), { recursive: true });
  writeFileSync(join(root, ".github/workflows/ok.yml"), "on: push\n");
  writeFileSync(
    join(root, ".github/workflows/ci.yml"),
    "jobs:\n  a:\n    steps:\n      - run: printf 'X-Robots-Tag: noindex'\n",
  );
  expect(check(root)).toEqual([
    ".github/workflows/ci.yml: Nested mappings are not allowed in compact mappings at line 4, column 14:",
  ]);
});
