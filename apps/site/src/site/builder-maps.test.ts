import { describe, expect, it } from "vitest";
import { previewMapsMarkup } from "./builder-maps.ts";

const markupOn = (provider: string, settings = {}) =>
  previewMapsMarkup(settings).find((map) => map.provider === provider)?.markup;

describe("previewMapsMarkup", () => {
  it("holds a map per provider, each naming it", () => {
    expect(markupOn("maplibre")).toBe('<maplace-map hold provider="maplibre"></maplace-map>');
    expect(markupOn("google")).toBe('<maplace-map hold provider="google"></maplace-map>');
  });

  it("gives Google's the key and map ID, and MapLibre's neither", () => {
    const settings = { apiKey: "k", mapId: "m" };
    expect(markupOn("google", settings)).toContain('api-key="k"');
    expect(markupOn("google", settings)).toContain('map-id="m"');
    expect(markupOn("maplibre", settings)).not.toContain('k"');
  });
});
