// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { createMapLibreAdapter } from "../maplibre/index";
import {
  MAPLIBRE_MAP_SETTINGS,
  mapLibreSettingsOf,
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

  it.each(Object.keys(REFUSED_IN_MAP_OPTIONS))(
    "refuses in map-options what createMapLibreAdapter refuses in mapOptions: %s",
    (key) => {
      expect(() => createMapLibreAdapter({ mapOptions: { [key]: 1 } })).toThrow(
        expect.objectContaining({ code: "invalid-input", field: `options.mapOptions.${key}` }),
      );
    },
  );
});
