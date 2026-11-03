// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { createMapLibreAdapter } from "../maplibre/index";
import { GOOGLE_NAMES_ON_MAPLIBRE } from "../validate/google-map-option-names";
import {
  MAPLIBRE_MAP_SETTINGS,
  mapLibreSettingsOf,
  mapStyleHostOf,
  REFUSED_IN_MAP_OPTIONS,
} from "./maplibre-attributes";
import { elementWith } from "./testing/dom";
import { mapSettingsThatChange } from "./testing/map-setting-values";

function refusal(attributes: Record<string, string>, field: string, problem: string) {
  expect(() => mapLibreSettingsOf(elementWith(attributes))).toThrow(
    expect.objectContaining({
      code: "invalid-input",
      field,
      message: `<maplace-map>: ${field} ${problem}`,
    }),
  );
}

describe("MAPLIBRE_MAP_SETTINGS", () => {
  it("lists exactly the map settings MapLibre's provider reads", () => {
    expect(new Set(mapSettingsThatChange(mapLibreSettingsOf))).toEqual(
      new Set(MAPLIBRE_MAP_SETTINGS),
    );
  });
});

describe("mapLibreSettingsOf", () => {
  it("reads map-style as a style URL, or as a style object written as JSON", () => {
    const url = "https://tiles.example/style.json";
    expect(mapLibreSettingsOf(elementWith({ "map-style": url })).mapStyle).toBe(url);
    const style = { version: 8, sources: {}, layers: [] };
    const element = elementWith({ "map-style": JSON.stringify(style) });
    expect(mapLibreSettingsOf(element).mapStyle).toEqual(style);
  });

  it.each([{}, { "map-style": "", "map-options": "" }])(
    "leaves both out when missing or empty: %j",
    (attributes) => {
      expect(mapLibreSettingsOf(elementWith(attributes))).toEqual({
        mapStyle: undefined,
        mapOptions: undefined,
      });
    },
  );

  it("reads map-options as a JSON object of MapLibre's map options", () => {
    const element = elementWith({ "map-options": '{"maxZoom":18,"dragRotate":true}' });
    expect(mapLibreSettingsOf(element).mapOptions).toEqual({ maxZoom: 18, dragRotate: true });
  });

  it.each([
    ["42", "42"],
    ["[1]", "an array"],
    ["null", "null"],
    ['""', '""'],
    ["{bad", '"{bad"'],
    ["[bad", '"[bad"'],
    ["   ", '"   "'],
  ])(
    "refuses a map-style that is neither a URL nor a style object, naming it: %s",
    (written, got) =>
      refusal(
        { "map-style": written },
        "map-style",
        `must be a style URL or a JSON style object, got ${got}`,
      ),
  );

  it.each([
    ["{bad", '"{bad"'],
    ["[1]", "an array"],
    ['"x"', '"x"'],
  ])("refuses map-options that aren't a JSON object: %s", (written, got) =>
    refusal({ "map-options": written }, "map-options", `must be a JSON object, got ${got}`),
  );

  it.each(Object.entries(REFUSED_IN_MAP_OPTIONS))(
    "keeps %s out of map-options, saying where it goes",
    (key, remark) =>
      refusal({ "map-options": JSON.stringify({ [key]: 1 }) }, `map-options.${key}`, remark),
  );

  it.each([
    ["center", "center"],
    ["zoom", "zoom"],
    ["set_center", "center"],
  ])("keeps %s out of map-options for the %s attribute", (key, attribute) =>
    refusal(
      { "map-options": JSON.stringify({ [key]: 1 }) },
      `map-options.${key}`,
      `is its own attribute: ${attribute}`,
    ),
  );

  it.each(Object.keys(REFUSED_IN_MAP_OPTIONS))(
    "refuses in map-options what createMapLibreAdapter refuses in mapOptions: %s",
    (key) => {
      expect(() => createMapLibreAdapter({ mapOptions: { [key]: 1 } })).toThrow(
        expect.objectContaining({ code: "invalid-input", field: `options.mapOptions.${key}` }),
      );
    },
  );
});

describe("Google's names on MapLibre", () => {
  it.each(Object.entries(GOOGLE_NAMES_ON_MAPLIBRE))(
    "refuses %s in map-options too",
    (key, remark) =>
      refusal({ "map-options": JSON.stringify({ [key]: 1 }) }, `map-options.${key}`, remark),
  );
});

describe("mapStyleHostOf", () => {
  const hostOf = (mapStyle?: string) =>
    mapStyleHostOf(elementWith(mapStyle === undefined ? {} : { "map-style": mapStyle }));

  it("names OpenFreeMap with no map-style, or an empty one", () => {
    expect(hostOf()).toBe("OpenFreeMap");
    expect(hostOf("")).toBe("OpenFreeMap");
  });

  it("names the host of an http(s) URL, its port kept", () => {
    expect(hostOf("https://tiles.example.com/style.json?key=1")).toBe("tiles.example.com");
    expect(hostOf("http://localhost:8080/style.json")).toBe("localhost:8080");
    expect(hostOf("https://tiles.example.com")).toBe("tiles.example.com");
  });

  it("names the host alone of a URL with user info", () => {
    expect(hostOf("https://user:secret@tiles.example.com/style.json")).toBe("tiles.example.com");
    expect(hostOf("https://good.example@evil.example/style.json")).toBe("evil.example");
  });

  it("names the host a fetch would reach, a backslash ending it as a slash does", () => {
    expect(hostOf("https://evil.example\\@good.example/style.json")).toBe("evil.example");
  });

  it("names no one for user info with no host", () => {
    expect(hostOf("https://user:secret@/style.json")).toBeUndefined();
  });

  it("reads an upper-case scheme", () => {
    expect(hostOf("HTTPS://tiles.example.com/style.json")).toBe("tiles.example.com");
  });

  it("names no one for a JSON style object", () => {
    expect(hostOf('{"version":8,"sources":{},"layers":[]}')).toBeUndefined();
  });

  it("names no one for a relative URL", () => {
    expect(hostOf("/styles/bright.json")).toBeUndefined();
    expect(hostOf("//tiles.example.com/style.json")).toBeUndefined();
  });

  it("names no one for another scheme", () => {
    expect(hostOf("mapbox://styles/mapbox/streets-v12")).toBeUndefined();
  });

  it("names no one for unparsed JSON, blank, or a number", () => {
    expect(hostOf("{not json")).toBeUndefined();
    expect(hostOf("   ")).toBeUndefined();
    expect(hostOf("5")).toBeUndefined();
  });
});
