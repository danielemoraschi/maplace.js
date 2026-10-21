// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { checkMapLibreOptions } from "./options";

const pageMap = { getContainer: () => document.createElement("div") };

function refusal(options: unknown, field: string, message: string) {
  return () =>
    expect(() => checkMapLibreOptions(options)).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        field,
        message: `createMapLibreAdapter: ${message}`,
      }),
    );
}

describe("checkMapLibreOptions", () => {
  it("accepts no options, a style URL or object, map options, a page map, and undefined", () => {
    expect(() => checkMapLibreOptions({})).not.toThrow();
    expect(() =>
      checkMapLibreOptions({ mapStyle: "https://tiles.example/style.json" }),
    ).not.toThrow();
    const style = { version: 8, sources: {}, layers: [] };
    expect(() =>
      checkMapLibreOptions({ mapStyle: style, mapOptions: { maxZoom: 18 } }),
    ).not.toThrow();
    expect(() => checkMapLibreOptions({ map: pageMap })).not.toThrow();
    const absent = { mapStyle: undefined, map: undefined, mapOptions: undefined };
    expect(() => checkMapLibreOptions(absent)).not.toThrow();
  });

  it(
    "needs an object of options",
    refusal(null, "options", "options must be an object of MapLibre adapter options, got null"),
  );

  it(
    "needs a style URL that isn't empty",
    refusal(
      { mapStyle: "" },
      "options.mapStyle",
      'options.mapStyle must be a non-empty string, got ""',
    ),
  );

  it(
    "needs a style URL or object",
    refusal(
      { mapStyle: 8 },
      "options.mapStyle",
      "options.mapStyle must be a style URL or a style object, got 8",
    ),
  );

  it(
    "tells `style` where the map's style goes: the store's style is a shape's",
    refusal(
      { style: "https://tiles.example/style.json" },
      "options.style",
      "options.style is not an option: the map's style is mapStyle",
    ),
  );

  it(
    "refuses map options maplace sets itself",
    refusal(
      { mapOptions: { center: [0, 0] } },
      "options.mapOptions.center",
      "options.mapOptions.center is set by the store's view",
    ),
  );

  it(
    "refuses something that isn't a MapLibre map",
    refusal(
      { map: {} },
      "options.map",
      "options.map must be a MapLibre map (maplibregl.Map), got an object",
    ),
  );

  it(
    "refuses a style for the page's own map",
    refusal(
      { map: pageMap, mapStyle: "https://tiles.example/style.json" },
      "options.mapStyle",
      "options.mapStyle is for a map maplace creates: set it on your own map",
    ),
  );
});
