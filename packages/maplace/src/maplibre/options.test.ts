// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { GOOGLE_NAMES_ON_MAPLIBRE } from "../validate/google-map-option-names";
import { createMapLibreMap } from "./maplibre-map";
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
    "refuses 0.2's set_center, which would otherwise be ignored",
    refusal(
      { mapOptions: { set_center: [0, 0] } },
      "options.mapOptions.set_center",
      "options.mapOptions.set_center is a 0.2 option: use the store's view",
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

  it("takes `globe: true`, or a corner and a label", () => {
    expect(() => checkMapLibreOptions({ globe: true })).not.toThrow();
    const globe = { position: "bottom-left", label: "Earth" };
    expect(() => checkMapLibreOptions({ globe })).not.toThrow();
    expect(() => checkMapLibreOptions({ globe: {} })).not.toThrow();
  });

  it(
    "refuses a globe corner that isn't one, naming it",
    refusal(
      { globe: { position: "middle" } },
      "options.globe.position",
      'options.globe.position must be one of "top-left", "top-right", "bottom-left", "bottom-right", got "middle"',
    ),
  );

  it(
    "refuses a blank globe label",
    refusal(
      { globe: { label: " " } },
      "options.globe.label",
      'options.globe.label must be a non-blank string, got " "',
    ),
  );

  it(
    "refuses a globe that is neither true nor its options",
    refusal(
      { globe: false },
      "options.globe",
      "options.globe must be true or an object, got false",
    ),
  );

  it(
    "refuses `globe` with the page's own map, saying it keeps its projection",
    refusal(
      { map: pageMap, globe: true },
      "options.globe",
      "options.globe is for a map maplace creates: your own map keeps its projection (setProjection)",
    ),
  );

  it.each(Object.entries(GOOGLE_NAMES_ON_MAPLIBRE))(
    "refuses Google's %s in mapOptions, saying MapLibre's",
    (key, remark) => {
      const field = `options.mapOptions.${key}`;
      refusal({ mapOptions: { [key]: false } }, field, `${field} ${remark}`)();
    },
  );

  it("leaves MapLibre's own names alone", () => {
    const own = { scrollZoom: false, dragPan: false, keyboard: false, pitch: 10, bearing: 10 };
    expect(() => checkMapLibreOptions({ mapOptions: own })).not.toThrow();
  });
});

describe("createMapLibreMap", () => {
  it("refuses scrollwheel", () => {
    const options = { mapOptions: { scrollwheel: false } };
    expect(() => createMapLibreMap(document.createElement("div"), options as never)).toThrow(
      expect.objectContaining({ code: "invalid-input", field: "options.mapOptions.scrollwheel" }),
    );
  });
});
