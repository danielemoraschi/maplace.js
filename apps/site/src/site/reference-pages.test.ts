import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "../../../../scripts/build/package.ts";
import { DOCS } from "../../../../scripts/checks/docs.ts";
import { referenceProblems } from "./reference-check.ts";
import { REFERENCE_DIR, referenceTables } from "./reference-tables.ts";
import { REPO_DOCS } from "./repo-docs.ts";

const TABLES = referenceTables();
const CHECKED_PAGES = [...new Set(TABLES.map(({ doc }) => doc))];
const ALL_PAGES = readdirSync(join(ROOT, REFERENCE_DIR))
  .filter((file) => file.endsWith(".md"))
  .map((file) => `${REFERENCE_DIR}${file}`);

describe.each(CHECKED_PAGES)("%s", (page) => {
  it("lists every name the API has, and only those", () => {
    expect(referenceProblems(TABLES.filter(({ doc }) => doc === page))).toEqual([]);
  });
});

describe.each(ALL_PAGES)("%s", (page) => {
  it("is a page of the site", () => {
    expect(REPO_DOCS.map(({ file }) => file)).toContain(page);
  });

  it("is a doc the doc links and snippets checks read", () => {
    expect(DOCS).toContain(page);
  });
});
