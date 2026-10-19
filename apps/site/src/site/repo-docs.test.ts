import { describe, expect, it } from "vitest";
import { packageManifest, readRootFile } from "../../../../scripts/build/package.ts";
import { repositoryPageFor } from "../../../../scripts/release/repository.ts";
import { REFERENCE_DIR } from "./reference-tables.ts";
import { REPO_DOCS, REPOSITORY_URL } from "./repo-docs.ts";

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
