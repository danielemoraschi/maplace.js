import { describe, expect, it } from "vitest";
import { readRootFile } from "../../../../scripts/build/package.ts";
import { installOf } from "./install-loader.ts";

describe("installOf", () => {
  const pin = { version: "1.2.3", integrityOf: (file: string) => `sha384-of-${file}` };

  it("offers the README's pinned scripts, Google's then MapLibre's, filled in", () => {
    const { version, providers } = installOf(pin);
    expect(version).toBe("1.2.3");
    expect(providers.map(({ provider }) => provider)).toEqual(["google", "maplibre"]);
    const [google, maplibre] = providers.map(({ cdnSnippet }) => cdnSnippet);
    expect(google).toContain('maplace@1.2.3/dist/maplace-element.iife.js"');
    expect(google).toContain('integrity="sha384-of-maplace-element.iife.js"');
    expect(maplibre).toContain('maplace@1.2.3/dist/maplace-element-maplibre.iife.js"');
    expect(maplibre).toContain('integrity="sha384-of-maplace-element-maplibre.iife.js"');
  });

  it("offers an npm command per provider, MapLibre's adding maplibre-gl", () => {
    const commands = installOf(pin).providers.map(({ npmCommand }) => npmCommand);
    expect(commands).toEqual(["npm install maplace", "npm install maplace maplibre-gl"]);
  });

  it("offers only npm commands the README gives", () => {
    const readme = readRootFile("README.md");
    const lines = new Set(readme.split("\n").map((line) => line.trim()));
    for (const { npmCommand } of installOf(pin).providers) {
      expect(readme.includes(`\`${npmCommand}\``) || lines.has(npmCommand)).toBe(true);
    }
  });
});
