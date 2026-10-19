import { describe, expect, it } from "vitest";
import { PACKAGE_ENTRIES, readRootFile } from "../../../../scripts/build/package.ts";
import { exportedNames } from "./entry-exports.ts";

describe("exportedNames", () => {
  it("reads an export list, its aliases and its type exports", () => {
    const source = 'export { a, b as c } from "./x";\nexport type { D, E as F } from "./y";';
    expect(exportedNames(source)).toEqual(["a", "c", "D", "F"]);
  });

  it("reads a list across lines, with type-only names and no source", () => {
    const source = "export {\n  a,\n  type B,\n};";
    expect(exportedNames(source)).toEqual(["a", "B"]);
  });

  it("reads exported declarations", () => {
    const source = [
      "export function f() {}",
      "export async function g() {}",
      "export const h = 1;",
      "export class K {}",
      "export interface I {}",
      "export type T = string;",
      "export enum E {}",
      "export const enum C {}",
    ].join("\n");
    expect(exportedNames(source)).toEqual(["f", "g", "h", "K", "I", "T", "E", "C"]);
  });

  it("keeps the source's order across both forms", () => {
    const source = 'export type A = 1;\nexport { b } from "./b";\nexport function c() {}';
    expect(exportedNames(source)).toEqual(["A", "b", "c"]);
  });

  it("ignores what isn't exported", () => {
    expect(exportedNames('import { a } from "./a";\nconst b = 1;\ninterface C {}')).toEqual([]);
  });

  it.each([
    ['export * from "./x";'],
    ['export * as x from "./x";'],
    ['export type * from "./x";'],
    ["export default f;"],
    ["export namespace N {}"],
    ["export declare namespace N {}"],
    ['export import x = require("./x");'],
    ["export const { a, b } = c;"],
    ["export = f;"],
  ])("refuses an export it can't list: %s", (source) => {
    expect(() => exportedNames(source)).toThrow(/name each export/);
  });

  it("reads the package's entries", () => {
    const names = (entry: keyof typeof PACKAGE_ENTRIES) =>
      exportedNames(readRootFile(PACKAGE_ENTRIES[entry]));
    expect(names("core")).toEqual(
      expect.arrayContaining(["createMaplace", "listedLocations", "Snapshot"]),
    );
    expect(names("react")).toEqual(expect.arrayContaining(["MaplaceProvider", "useMaplace"]));
    expect(names("elementGoogle")).toEqual(["MaplaceMapElement"]);
  });
});
