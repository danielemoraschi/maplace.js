import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { importsOf } from "../checks/imports.ts";
import { declarationFiles, emitDeclarations } from "./declarations.ts";
import { packageManifest } from "./package.ts";
import { tempDir } from "./temp-dir.ts";

const outdir = tempDir("types");
let declarations: Map<string, string>;

beforeAll(() => {
  emitDeclarations(outdir);
  declarations = new Map(
    declarationFiles(outdir).map((file) => [file, readFileSync(file, "utf8")]),
  );
});

describe("the declarations", () => {
  it("are emitted for every entry the manifest names", () => {
    const typed = Object.values(packageManifest().exports).flatMap((target) =>
      typeof target === "string" || target.types === undefined ? [] : [target.types],
    );
    expect(typed).toHaveLength(6);
    for (const types of typed) {
      expect(existsSync(join(outdir, types.replace("./dist/", "")))).toBe(true);
    }
  });

  it("name in each relative import a .js file whose declaration exists", () => {
    for (const [file, text] of declarations) {
      for (const specifier of importsOf(text).filter((path) => path.startsWith("."))) {
        expect(specifier, file).toMatch(/\.js$/);
        expect(existsSync(join(dirname(file), `${specifier.slice(0, -3)}.d.ts`)), file).toBe(true);
      }
    }
  });

  it("keep the reference to Google's types wherever they name them", () => {
    const naming = [...declarations].filter(([, text]) => text.includes("google.maps."));
    expect(naming.length).toBeGreaterThan(0);
    for (const [file, text] of naming) {
      expect(text, file).toContain('/// <reference types="google.maps" preserve="true" />');
    }
  });
});
