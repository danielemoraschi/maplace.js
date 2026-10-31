import { describe, expect, it } from "vitest";
import { endOfStringAt, LiteralScanner } from "./builder-literal-scan.ts";

const B = String.fromCharCode(92);

describe("LiteralScanner", () => {
  it("skips whitespace and both kinds of comment", () => {
    const scanner = new LiteralScanner(" // a\n /* b */ x");
    scanner.skipTrivia();
    expect(scanner.peek()).toBe("x");
  });

  it("takes an unclosed comment to the end", () => {
    const scanner = new LiteralScanner("/* never");
    scanner.skipTrivia();
    expect(scanner.atEnd()).toBe(true);
  });

  it.each([
    [String.raw`"a\nb"`, "a\nb"],
    [String.raw`'it\'s'`, "it's"],
    [`"${B}u0041${B}x42${B}u{43}"`, "ABC"],
    [String.raw`"\/"`, "/"],
  ])("reads the string %s", (source, value) => {
    expect(new LiteralScanner(source).readString()).toBe(value);
  });

  it("refuses a negative code point as a bad escape", () => {
    expect(() => new LiteralScanner(`"${B}u{-1}"`).readString()).toThrow("bad");
  });

  it("names the line of an unclosed string", () => {
    expect(() => new LiteralScanner("\n'abc\ndef'", 1).readString()).toThrow("Line 2");
  });

  it.each([
    ["1", 1],
    ["-1.5e2", -150],
    ["+.5", 0.5],
    ["-0x10", -16],
  ])("reads the number %s", (source, value) => {
    expect(new LiteralScanner(source).readNumber()).toBe(value);
  });

  it("keeps its place when no number is there", () => {
    const scanner = new LiteralScanner("-x");
    expect(scanner.readNumber()).toBeUndefined();
    expect(scanner.position).toBe(0);
  });

  it("reads a key quoted, as a number or a word, and refuses a spread", () => {
    expect(new LiteralScanner("'a b'").readKey()).toBe("a b");
    expect(new LiteralScanner("12").readKey()).toBe("12");
    expect(new LiteralScanner("$a").readKey()).toBe("$a");
    expect(() => new LiteralScanner("...a").readKey()).toThrow("a key");
  });

  it("skips an expression to its end, past brackets, strings, comments and templates", () => {
    const source = "function () { return '}' + `,` /* ] */; }";
    const scanner = new LiteralScanner(`${source}, next`);
    expect(scanner.skipExpression()).toBe(source);
    expect(scanner.peek()).toBe(",");
  });

  it("refuses an expression that never ends", () => {
    expect(() => new LiteralScanner("foo(").skipExpression()).toThrow("never ends");
    expect(() => new LiteralScanner("`foo").skipExpression()).toThrow("never closes");
  });
});

describe("endOfStringAt", () => {
  it("stops at the closing quote, or at the line's end when there is none", () => {
    expect(endOfStringAt("'a' b", 0)).toBe(3);
    expect(endOfStringAt("'a\nb'", 0)).toBe(2);
    expect(endOfStringAt("'a", 0)).toBe(2);
  });
});
