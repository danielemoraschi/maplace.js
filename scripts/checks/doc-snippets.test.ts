import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { tempDir } from "../build/temp-dir.ts";
import { check, snippetsIn } from "./doc-snippets.ts";

describe("snippetsIn", () => {
  it("reads the fence after each example marker, without its info string", () => {
    const markdown = [
      "# x",
      "<!-- example: ex/a.html -->",
      "```html",
      "<p>a</p>",
      "<p>b</p>",
      "```",
      "```ts",
      "unmarked();",
      "```",
    ].join("\n");
    expect(snippetsIn(markdown)).toEqual([
      { source: "ex/a.html", code: "<p>a</p>\n<p>b</p>", line: 2 },
    ]);
  });
});

it("names a marker with no fence right below it, and a fence never closed", () => {
  const root = tempDir("doc-markers");
  mkdirSync(join(root, "ex"));
  writeFileSync(join(root, "ex", "a.ts"), "a();\n");
  writeFileSync(
    join(root, "README.md"),
    "<!-- example: ex/a.ts -->\n\n```ts\na();\n```\n<!-- example: ex/a.ts -->\n```ts\na();\n",
  );
  expect(check(root, ["README.md"])).toEqual([
    "README.md line 1: the example marker isn't followed by a fence",
    "README.md line 6: the snippet's fence is never closed",
  ]);
});

it("passes the repo's own docs", () => {
  expect(check()).toEqual([]);
});

it("names a snippet that differs from its example, and an example that's missing", () => {
  const root = tempDir("doc-snippets");
  mkdirSync(join(root, "ex"));
  writeFileSync(join(root, "ex", "a.ts"), "same();\n");
  writeFileSync(join(root, "ex", "b.ts"), "theirs();\n");
  const marked = (source: string, code: string) =>
    `<!-- example: ${source} -->\n\`\`\`ts\n${code}\n\`\`\`\n`;
  writeFileSync(
    join(root, "README.md"),
    marked("ex/a.ts", "same();") + marked("ex/b.ts", "mine();") + marked("ex/c.ts", "x();"),
  );
  expect(check(root, ["README.md"])).toEqual([
    "README.md line 5: the snippet differs from ex/b.ts",
    "README.md line 9: ex/c.ts doesn't exist",
  ]);
});
