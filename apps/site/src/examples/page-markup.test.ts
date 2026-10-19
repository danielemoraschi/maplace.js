import { describe, expect, it } from "vitest";
import { attributeValue, inertScripts, requireOnce, withoutDoctype } from "./page-markup.ts";
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

describe("requireOnce", () => {
  it("is the one match", () => {
    expect(requireOnce("<b>x</b>", /<b>[^<]*<\/b>/g, "one bold")).toBe("<b>x</b>");
  });

  it("refuses none or more, saying what an example must have and how many it has", () => {
    expect(() => requireOnce("<i></i>", /<b>/g, "an example has one bold")).toThrow(
      "an example has one bold: this one has 0",
    );
    expect(() => requireOnce("<b><b>", /<b>/g, "an example has one bold")).toThrow(
      "an example has one bold: this one has 2",
    );
  });

  it("refuses a pattern that isn't global, which would find only the first match", () => {
    expect(() => requireOnce("<b><b>", /<b>/, "an example has one bold")).toThrow(TypeError);
  });
});
