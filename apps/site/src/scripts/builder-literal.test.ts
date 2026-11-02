import { describe, expect, it } from "vitest";
import {
  firstRefusedIn,
  isRecord,
  type Literal,
  Refused,
  readLiteral,
  refusalWords,
} from "./builder-literal.ts";

const field = (source: string): Literal =>
  (readLiteral(`{ a: ${source}, next: 1 }`) as Record<string, Literal>).a;

describe("readLiteral", () => {
  it("reads strict JSON as JSON.parse does", () => {
    const values = [
      [],
      {},
      [1, -1.5, 2e3, true, false, null, "x"],
      { "a b": [{ c: '\n\t"\\é' }], d: { e: [] } },
    ];
    for (const value of values) {
      const text = JSON.stringify(value);
      expect(readLiteral(text)).toEqual(JSON.parse(text));
    }
  });

  it("reads unquoted keys, single quotes, trailing commas, comments and undefined", () => {
    expect(
      readLiteral(`{
        // a comment
        a: 'x', /* another */ b: [1, 2,], "c": undefined,
      }`),
    ).toEqual({ a: "x", b: [1, 2], c: undefined });
  });

  it("joins strings with +", () => {
    expect(field("'<b>' + \"x\" +\n '</b>'")).toBe("<b>x</b>");
  });

  it.each([
    "function () { return { b: '}' }; }",
    "(x) => x",
    "x => { return x }",
    "google.maps.Animation.DROP",
    "new Foo()",
    "1 + 2",
    "'a'.toUpperCase()",
    "'a' + b",
    "Locs",
  ])("leaves %s as Refused with its source, and reads the next key", (source) => {
    const read = readLiteral(`{ a: ${source}, next: 1 }`) as Record<string, Literal>;
    expect(read.a).toEqual(new Refused(source));
    expect(read.next).toBe(1);
  });

  it("leaves shorthand and methods as Refused", () => {
    const read = readLiteral("{ a, b() { return 1 }, next: 1 }") as Record<string, Literal>;
    expect(read.a).toEqual(new Refused("a"));
    expect(read.b).toEqual(new Refused("b() { return 1 }"));
    expect(read.next).toBe(1);
  });

  it("leaves __proto__ an own key, and Object.prototype alone", () => {
    const read = readLiteral('{ "__proto__": { polluted: 1 }, __proto__: 2 }') as object;
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.hasOwn(read, "__proto__")).toBe(true);
    expect(Object.getPrototypeOf(read)).toBe(Object.prototype);
  });

  it("refuses 100,000 brackets rather than overflowing", () => {
    expect(() => readLiteral("[".repeat(100_000))).toThrow("deeper");
  });

  it.each([
    ["an unclosed string", "{\n a: 'x\n}", "Line 2"],
    ["an unclosed bracket", "[1, 2", "missing"],
    ["an expression that never ends", "{ a: foo(", "never ends"],
    ["a spread", "{ ...a }", "a key"],
    ["nothing", "hello", "no value"],
    ["an empty call", "new Maplace()", "no value"],
  ])("refuses %s", (_name, text, words) => {
    expect(() => readLiteral(text)).toThrow(words);
  });

  it("refuses a second value rather than dropping it", () => {
    expect(() => readLiteral("[{ a: 1 }] [{ a: 2 }]")).toThrow("Line 1");
    expect(() => readLiteral("var a = [1];\nvar b = [2];")).toThrow("Line 2");
    expect(() => readLiteral("({ a: 1 }) ({ a: 2 })")).toThrow("a second value");
    expect(readLiteral("var a = [1];")).toEqual([1]);
  });

  it("reads a value that isn't data as Refused at the top too", () => {
    expect(readLiteral("new Maplace(config).Load();")).toEqual(new Refused("config"));
  });

  it("starts inside new Maplace(, wherever it is", () => {
    expect(readLiteral("$(function () { new Maplace({ a: 1 }).Load(); })")).toEqual({ a: 1 });
  });

  it("finds new Maplace( after a stray apostrophe on an earlier line", () => {
    expect(readLiteral("var s = don't\nnew Maplace({ a: 1 })")).toEqual({ a: 1 });
  });
});

describe("what to do with code", () => {
  it("finds the first Refused at any depth", () => {
    const refused = new Refused("x");
    expect(firstRefusedIn({ a: [1, { b: refused }] })).toBe(refused);
    expect(firstRefusedIn({ a: [1, { b: 2 }] })).toBeUndefined();
  });

  it("tells a record from a list, null and code", () => {
    expect(isRecord({})).toBe(true);
    for (const value of [[], null, 1, "x", new Refused("x")]) expect(isRecord(value)).toBe(false);
  });

  it.each([
    ["function () {}", "a function"],
    ["(a) => a", "a function"],
    ["google.maps.MapTypeId.ROADMAP", "google.maps.MapTypeId.ROADMAP"],
    ["foo()", "foo()"],
    ["x".repeat(70), `${"x".repeat(60)}…`],
  ])("calls %s %s", (source, words) => {
    expect(refusalWords(new Refused(source))).toBe(words);
  });
});
