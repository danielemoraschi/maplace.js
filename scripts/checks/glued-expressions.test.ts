import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "../build/package.ts";
import { tempDir } from "../build/temp-dir.ts";
import { check, gluedInTemplate } from "./glued-expressions.ts";

const inParagraph = (text: string) => `<p>\n${text}\n</p>\n`;

it("reads templates with the parser Astro builds them with, not a copy of its own", () => {
  const parserFor = (packageJson: string) =>
    createRequire(join(ROOT, packageJson)).resolve("@astrojs/compiler-rs");
  expect(parserFor("package.json")).toBe(parserFor("node_modules/astro/package.json"));
});

it("passes the site's own templates", () => {
  expect(check()).toEqual([]);
});

describe("text and an expression across a line break", () => {
  it("names text ended by the break, on the break's line, past non-ASCII text", () => {
    const source = '---\nconst M = "é";\n---\n<p>“é” first line\nmaintained by\n{M}</p>\n';
    expect(gluedInTemplate(source)).toEqual([
      'line 5: "maintained by" runs into an expression: keep the space with {" "}',
    ]);
  });

  it("names an expression followed by the break and a word", () => {
    expect(gluedInTemplate(inParagraph("{M}\nkeeps the site"))).toEqual([
      'line 2: an expression runs into "keeps the site": keep the space with {" "}',
    ]);
  });

  it("finds it at a template's top level", () => {
    expect(gluedInTemplate("maintained by\n{M}\n")).toEqual([
      'line 1: "maintained by" runs into an expression: keep the space with {" "}',
    ]);
  });

  it("finds it inside an expression's own markup", () => {
    expect(gluedInTemplate("{items.map((x) => <a>by\n{x}</a>)}\n")).toEqual([
      'line 1: "by" runs into an expression: keep the space with {" "}',
    ]);
  });

  it("names text before an empty string, which keeps no space", () => {
    expect(gluedInTemplate(inParagraph('by\n{""}'))).toEqual([
      'line 2: "by" runs into an expression: keep the space with {" "}',
    ]);
  });

  it("names an expression that is a string of words", () => {
    expect(gluedInTemplate(inParagraph('by\n{"foo"}'))).toEqual([
      'line 2: "by" runs into an expression: keep the space with {" "}',
    ]);
  });
});

describe("what isn't glued", () => {
  it.each([
    ["a bridge after the text", 'by{" "}\n{M}'],
    ["a bridge before the expression", 'by\n{" "}\n{M}'],
    ["a bridge after the expression", '{M}{" "}\nkeeps'],
    ["a bridge before the text", '{M}\n{" "}\nkeeps'],
    ["the same line", "by {M} keeps"],
    ["an opening bracket before the break", "(\n{M})"],
    ["a square bracket before the break", "[\n{M}]"],
    ["closing punctuation after the break", "{M}\n, and more"],
    ["a semicolon after the break", "{M}\n; and more"],
    ["a comment", "by\n{/* a note */}"],
  ])("leaves %s alone", (_, text) => {
    expect(gluedInTemplate(inParagraph(text))).toEqual([]);
  });

  it.each([
    ["frontmatter", '---\nconst a = "by\\n";\n---\n<p>{a}</p>\n'],
    ["attributes", '<a\n  href={M}\n  class="x"\n>text</a>\n'],
    ["<pre>", "<pre>by\n{M}\nkeeps</pre>\n"],
    ["<textarea>", "<textarea>by\n{M}</textarea>\n"],
    ["<title>", "<title>by\n{M}</title>\n"],
  ])("ignores %s", (_, source) => {
    expect(gluedInTemplate(source)).toEqual([]);
  });
});

it("names a template the parser can't read, by line", () => {
  const [problem] = gluedInTemplate("<p>ok</p>\n<p>{ </p>\n");
  expect(problem).toMatch(/^line 2: can't be read: /);
});

it("names the file, relative to the root", () => {
  const root = tempDir("glued-expressions");
  const pages = join(root, "apps/site/src/pages");
  mkdirSync(pages, { recursive: true });
  writeFileSync(join(pages, "a.astro"), "by\n{M}\n");
  writeFileSync(join(pages, "b.astro"), "by {M}\n");
  expect(check(root)).toEqual([
    'apps/site/src/pages/a.astro line 1: "by" runs into an expression: keep the space with {" "}',
  ]);
});
