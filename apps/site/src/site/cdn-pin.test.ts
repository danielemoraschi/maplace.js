import { describe, expect, it, vi } from "vitest";
import { CDN_SCRIPTS } from "../../../../scripts/build/cdn-builds.ts";
import { integrityOf } from "../../../../scripts/build/subresource-integrity.ts";
import { cdnPin, installOf } from "./cdn-pin.ts";

/** Each script's bytes stand in for its build: the in-memory build is cdn-builds.test.ts's. */
const BYTES = { plain: new Uint8Array([1]), cluster: new Uint8Array([2]) };

vi.mock("../../../../scripts/build/cdn-builds.ts", async (actual) => ({
  ...(await actual<object>()),
  builtCdnScript: async (script: keyof typeof BYTES) => BYTES[script],
}));

describe("cdnPin", () => {
  it("pins the package's version and each CDN script to its own build's integrity", async () => {
    const pin = await cdnPin();
    expect(pin.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(pin.integrityOf(CDN_SCRIPTS.plain)).toBe(integrityOf(BYTES.plain));
    expect(pin.integrityOf(CDN_SCRIPTS.cluster)).toBe(integrityOf(BYTES.cluster));
  });

  it("refuses a file that isn't a CDN script", async () => {
    const pin = await cdnPin();
    expect(() => pin.integrityOf("other.js")).toThrow(/other\.js/);
  });
});

describe("installOf", () => {
  it("is the README's pinned element snippet, filled in", () => {
    const pin = { version: "1.2.3", integrityOf: (file: string) => `sha384-of-${file}` };
    const { version, snippet } = installOf(pin);
    expect(version).toBe("1.2.3");
    expect(snippet).toContain('maplace@1.2.3/dist/maplace-element.iife.js"');
    expect(snippet).toContain('integrity="sha384-of-maplace-element.iife.js"');
  });
});
