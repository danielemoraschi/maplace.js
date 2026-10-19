import { describe, expect, it } from "vitest";
import { installOf } from "./install-loader.ts";

describe("installOf", () => {
  it("is the README's pinned element snippet, filled in", () => {
    const pin = { version: "1.2.3", integrityOf: (file: string) => `sha384-of-${file}` };
    const { version, snippet } = installOf(pin);
    expect(version).toBe("1.2.3");
    expect(snippet).toContain('maplace@1.2.3/dist/maplace-element.iife.js"');
    expect(snippet).toContain('integrity="sha384-of-maplace-element.iife.js"');
  });
});
