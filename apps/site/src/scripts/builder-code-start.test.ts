import { describe, expect, it } from "vitest";
import { isCode, startOfValue } from "./builder-code-start.ts";

describe("startOfValue and isCode", () => {
  it("never throw on an unclosed string or comment", () => {
    for (const text of ["'abc", "/* abc", "L'Aquila,1,2\nx'y,3,4"]) {
      expect(() => startOfValue(text)).not.toThrow();
      expect(isCode(text)).toBe(false);
    }
  });

  it("skips comments and strings when looking for the value", () => {
    expect(startOfValue("// [a]\n'[b]' {")).toBe(13);
    expect(startOfValue("/* new Maplace({ */ [1]")).toBe(20);
  });

  it.each([
    ["{ a: 1 }", true],
    ["  // x\n[1]", true],
    ["var a = [1]", true],
    ["let a = [1]", true],
    ["const a = [1]", true],
    ["$(function () { new Maplace({}) })", true],
    ["variant,lat,lng", false],
    ["letter,lat,lng", false],
    ["constituency,lat,lng", false],
    ["lat,lng\n1,2", false],
    ["title,lat,lng\n'new Maplace(',1,2", false],
  ])("%s: %s", (text, expected) => {
    expect(isCode(text)).toBe(expected);
  });
});
