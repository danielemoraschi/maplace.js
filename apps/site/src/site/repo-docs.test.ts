import { describe, expect, it } from "vitest";
import { packageManifest, readRootFile } from "../../../../scripts/build/package.ts";
import { repositoryPageFor } from "../../../../scripts/release/repository.ts";
import { REFERENCE_DIR } from "./reference-tables.ts";
import { REPO_DOCS, REPOSITORY_URL, repoDocMarkdown, withoutTitle } from "./repo-docs.ts";

const settings = {
  pin: { version: "1.2.3", integrityOf: (file: string) => `sha384-of-${file}` },
  blobBase: "https://github.com/o/r/blob/abc123/",
};

describe("withoutTitle", () => {
  it("drops the document's own title, which the page writes", () => {
    expect(withoutTitle("# maplace\n\nA list of locations.")).toBe("A list of locations.");
  });

  it("keeps a document without one as it is", () => {
    expect(withoutTitle("A list.\n\n# Later")).toBe("A list.\n\n# Later");
  });
});

describe("repoDocMarkdown", () => {
  const doc = (id: string) =>
    REPO_DOCS.find((each) => each.id === id) as (typeof REPO_DOCS)[number];

  it("pins Getting started's CDN scripts and links Migrating to its page", () => {
    const markdown = repoDocMarkdown(doc("getting-started"), settings);
    expect(markdown).toContain('maplace@1.2.3/dist/maplace-element.iife.js"');
    expect(markdown).toContain('integrity="sha384-of-maplace-element.iife.js"');
    expect(markdown).toContain("](/migrating/)");
    expect(markdown).not.toMatch(/^# maplace/);
  });

  it("renders Migrating as written, its repo links to the repo", () => {
    const markdown = repoDocMarkdown(doc("migrating"), settings);
    expect(markdown).toContain("](https://github.com/o/r/blob/abc123/");
    expect(markdown).not.toMatch(/\]\((?!https:|#|\/)[^)]+\.md\)/);
  });
});

describe("repoDocMarkdown of a reference page", () => {
  const locations = REPO_DOCS.find(({ id }) => id === "locations") as (typeof REPO_DOCS)[number];

  it("reads its links relative to it: a doc to its page, any other file to the repo", () => {
    const markdown = repoDocMarkdown(locations, settings);
    expect(markdown).toContain("](/migrating/#location-fields)");
    expect(markdown).toContain("](https://github.com/o/r/blob/abc123/docs/rfc-1.0.md#shape)");
  });
});

describe("REPO_DOCS", () => {
  it("gives every page a description for search and sharing", () => {
    for (const { id, description } of REPO_DOCS) expect(description, id).toMatch(/\S/);
  });

  it("starts each reference page with its title, which GitHub shows and the site writes", () => {
    for (const { file, title } of REPO_DOCS.filter(({ file }) => file.startsWith(REFERENCE_DIR))) {
      expect(readRootFile(file).split("\n")[0], file).toBe(`# ${title}`);
    }
  });

  it("uses each id and each file once", () => {
    for (const key of ["id", "file"] as const) {
      const values = REPO_DOCS.map((doc) => doc[key]);
      expect(new Set(values).size, key).toBe(values.length);
    }
  });
});

describe("REPOSITORY_URL", () => {
  it("is the repository the package's manifest names", () => {
    expect(REPOSITORY_URL).toBe(repositoryPageFor(packageManifest()));
  });
});
