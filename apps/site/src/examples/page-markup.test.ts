import { describe, expect, it } from "vitest";
import { attributeValue, inertScripts, withoutDoctype } from "./page-markup.ts";
import { INERT_SCRIPT_TYPE } from "./page-scripts.ts";

describe("withoutDoctype", () => {
  it("leaves out a leading doctype, whatever its case, and what follows it as it is", () => {
    expect(withoutDoctype("<!DOCTYPE html>\n<p></p>")).toBe("<p></p>");
    expect(withoutDoctype("<p></p>")).toBe("<p></p>");
  });
});

describe("inertScripts", () => {
  it("makes a classic and a module inline script inert, a module keeping its type to run with", () => {
    const html = '<script>a()</script><script type="module">b()</script>';
    expect(inertScripts(html)).toBe(
      `<script type="${INERT_SCRIPT_TYPE}">a()</script>` +
        `<script type="${INERT_SCRIPT_TYPE}" data-type="module">b()</script>`,
    );
  });

  it("refuses any other script", () => {
    expect(() => inertScripts('<script src="/other.js"></script>')).toThrow(/script src/);
  });
});

describe("attributeValue", () => {
  it("escapes what would end or open markup in a quoted attribute", () => {
    expect(attributeValue('a"b<c&')).toBe("a&quot;b&lt;c&amp;");
  });
});
