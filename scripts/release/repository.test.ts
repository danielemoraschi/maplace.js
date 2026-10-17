import { describe, expect, it } from "vitest";
import { packageManifest } from "../build/package.ts";
import { blobBaseFor, repositoryPageFor } from "./repository.ts";

const BLOB = "https://github.com/owner/repo/blob/v1.1.0/";

it("reads the GitHub repository in npm's form and in a plain URL", () => {
  for (const url of ["git+https://github.com/owner/repo.git", "https://github.com/owner/repo"]) {
    expect(blobBaseFor({ repository: { type: "git", url } }, "v1.1.0")).toBe(BLOB);
  }
});

it("refuses a manifest without a GitHub repository", () => {
  for (const repository of [undefined, { url: "https://gitlab.com/owner/repo" }]) {
    expect(() => blobBaseFor({ repository }, "v1.1.0")).toThrow(
      "the package manifest names no GitHub repository",
    );
  }
});

it("reads the package's own manifest, which npm's provenance checks against the repo", () => {
  expect(blobBaseFor(packageManifest(), "v1.1.0")).toBe(
    "https://github.com/danielemoraschi/maplace.js/blob/v1.1.0/",
  );
});

describe("repositoryPageFor", () => {
  it("is the repository's page on GitHub", () => {
    const repository = { type: "git", url: "git+https://github.com/o/r.git" };
    expect(repositoryPageFor({ repository })).toBe("https://github.com/o/r");
  });
});
