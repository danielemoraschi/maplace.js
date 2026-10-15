// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { defineElements } from "./define";
import { MaplaceMap } from "./map-element";
import { MAPLACE_VERSION } from "./version";

describe("defineElements", () => {
  it("leaves another copy's elements in place and says so once, naming both versions", () => {
    class OtherCopy extends HTMLElement {
      static readonly maplaceVersion = "0.9.0";
    }
    customElements.define("maplace-map", OtherCopy);
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    defineElements();
    defineElements();
    expect(customElements.get("maplace-map")).toBe(OtherCopy);
    expect(customElements.get("maplace-map")).not.toBe(MaplaceMap);
    expect(logged).toHaveBeenCalledOnce();
    expect(logged.mock.calls[0]?.[0]).toMatch(
      new RegExp(`maplace ${MAPLACE_VERSION}: .* already defined by maplace 0\\.9\\.0`),
    );
  });

  it("names this copy by the package's version", () => {
    // Tests run from the repository's root.
    const manifest = readFileSync("packages/maplace/package.json", "utf8");
    const { version } = JSON.parse(manifest) as { version: string };
    expect(MAPLACE_VERSION).toBe(version);
  });
});
