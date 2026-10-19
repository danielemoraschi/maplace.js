import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { relativeLinksIn } from "../docs/markdown.ts";
import { CDN_SCRIPTS } from "./cdn-builds.ts";
import { stagedBeforeTests } from "./staged-test-package.ts";
import { integrityOfFile } from "./subresource-integrity.ts";

const { packageDir, manifest } = stagedBeforeTests("stage");

describe("the staged package", () => {
  it("has its licence and readme, as npm packs them", () => {
    for (const file of ["package.json", "LICENSE", "README.md", "CHANGELOG.md"]) {
      expect(existsSync(join(packageDir, file)), file).toBe(true);
    }
  });

  it("ships a README pinning each CDN script to its version and its integrity", () => {
    const readme = readFileSync(join(packageDir, "README.md"), "utf8");
    for (const file of Object.values(CDN_SCRIPTS)) {
      const integrity = integrityOfFile(join(packageDir, "dist", file));
      expect(readme).toContain(
        `maplace@${manifest().version}/dist/${file}"\n  integrity="${integrity}"`,
      );
    }
    expect(readme).not.toContain("x.y.z");
    expect(relativeLinksIn(readme)).toEqual([]);
  });

  it("ships a changelog whose links reach the repo at the version's tag", () => {
    const changelog = readFileSync(join(packageDir, "CHANGELOG.md"), "utf8");
    const { version } = manifest();
    expect(changelog).toContain(
      `(https://github.com/danielemoraschi/maplace.js/blob/v${version}/docs/rfc-1.0.md)`,
    );
    expect(relativeLinksIn(changelog)).toEqual([]);
  });
});
