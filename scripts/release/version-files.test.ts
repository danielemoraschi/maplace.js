import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "../build/package.ts";
import { VERSION_FILES, type VersionFile, withVersion } from "./version-files.ts";

function versionFile(path: string): VersionFile {
  const file = VERSION_FILES.find((candidate) => candidate.path.endsWith(path));
  if (file === undefined) throw new Error(`no version file ${path}`);
  return file;
}

const manifest = versionFile("maplace/package.json");
const lockfile = versionFile("package-lock.json");
const constant = versionFile("element/version.ts");

describe("withVersion", () => {
  it("changes the version and nothing else", () => {
    const text =
      '{\n  "name": "maplace",\n  "version": "0.0.0",\n  "dependencies": {\n    "x": { "version": "1.0.0" }\n  }\n}\n';
    expect(withVersion(text, { file: manifest, version: "1.0.0-beta.1" })).toBe(
      text.replace('"version": "0.0.0"', '"version": "1.0.0-beta.1"'),
    );
  });

  it("changes the workspace's entry in the lockfile, not another package's", () => {
    const text =
      '{\n  "packages": {\n    "node_modules/x": {\n      "version": "0.0.0"\n    },\n' +
      '    "packages/maplace": {\n      "version": "0.0.0",\n      "license": "MIT"\n    }\n  }\n}\n';
    expect(withVersion(text, { file: lockfile, version: "1.0.0" })).toBe(
      text.replace(
        '"packages/maplace": {\n      "version": "0.0.0"',
        '"packages/maplace": {\n      "version": "1.0.0"',
      ),
    );
  });

  it("refuses a file where the version isn't found exactly once", () => {
    expect(() => withVersion("no version here", { file: constant, version: "1.0.0" })).toThrow(
      `${constant.path}: found the version 0 times, not once`,
    );
  });
});

describe("VERSION_FILES", () => {
  it.each(VERSION_FILES.map((file) => [file.path, file]))(
    "find the version exactly once in the repo's %s",
    (path, file) => {
      const text = readFileSync(resolve(ROOT, path), "utf8");
      expect(() => withVersion(text, { file, version: "9.9.9" })).not.toThrow();
    },
  );
});
