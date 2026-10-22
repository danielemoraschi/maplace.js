import { describe, expect, it } from "vitest";
import { installOf } from "./install-loader.ts";

describe("installOf", () => {
  const pin = { version: "1.2.3", integrityOf: (file: string) => `sha384-of-${file}` };

  it("offers the README's pinned scripts, Google's then MapLibre's, filled in", () => {
    const { version, scripts } = installOf(pin);
    expect(version).toBe("1.2.3");
    expect(scripts.map(({ provider }) => provider)).toEqual(["google", "maplibre"]);
    const [google, maplibre] = scripts.map(({ snippet }) => snippet);
    expect(google).toContain('maplace@1.2.3/dist/maplace-element.iife.js"');
    expect(google).toContain('integrity="sha384-of-maplace-element.iife.js"');
    expect(maplibre).toContain('maplace@1.2.3/dist/maplace-element-maplibre.iife.js"');
    expect(maplibre).toContain('integrity="sha384-of-maplace-element-maplibre.iife.js"');
  });
});
