import { isAbsolute } from "node:path";
import { expect, it } from "vitest";
import { installedGit, installedNpmCli } from "./installed-tool.ts";

it("finds git and npm's CLI at absolute paths, not on PATH", () => {
  expect(isAbsolute(installedGit())).toBe(true);
  expect(isAbsolute(installedNpmCli())).toBe(true);
});
