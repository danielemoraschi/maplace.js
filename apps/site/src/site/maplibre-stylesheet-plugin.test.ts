import { describe, expect, it } from "vitest";
import { MAPLIBRE_STYLESHEET, mapLibreStylesheetEmptied } from "./maplibre-stylesheet-plugin.ts";

const plugin = mapLibreStylesheetEmptied();
const resolve = plugin.resolveId as (source: string) => string | undefined;
const load = plugin.load as (id: string) => string | undefined;
const appliesTo = plugin.applyToEnvironment as (environment: { name: string }) => boolean;

describe("mapLibreStylesheetEmptied", () => {
  it("empties MapLibre's stylesheet import, every other import left alone", () => {
    const emptied = resolve(MAPLIBRE_STYLESHEET);
    expect(emptied).toBeDefined();
    expect(emptied).not.toMatch(/\.css$/);
    expect(load(emptied as string)).toBe("");
    for (const other of [`${MAPLIBRE_STYLESHEET}?url`, "maplibre-gl", "./site.css"])
      expect(resolve(other), other).toBeUndefined();
    expect(load("maplibre-gl")).toBeUndefined();
  });

  it("acts in the client build only, so the server's map components keep the sheet", () => {
    expect(appliesTo({ name: "client" })).toBe(true);
    expect(appliesTo({ name: "ssr" })).toBe(false);
  });
});
