// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { createdMapSettingsOf } from "./google-map-attributes";
import { elementWith } from "./testing/dom";

function refusal(attributes: Record<string, string>, field: string, problem: string) {
  expect(() => createdMapSettingsOf(elementWith(attributes))).toThrow(
    expect.objectContaining({
      code: "invalid-input",
      field,
      message: `<maplace-map>: ${field} ${problem}`,
    }),
  );
}

describe("createdMapSettingsOf", () => {
  it("reads the colour scheme, and Google's map options as JSON", () => {
    const element = elementWith({
      "color-scheme": "dark",
      "map-options": '{"mapTypeControl":true,"gestureHandling":"cooperative"}',
    });
    expect(createdMapSettingsOf(element)).toEqual({
      colorScheme: "dark",
      mapOptions: { mapTypeControl: true, gestureHandling: "cooperative" },
    });
  });

  it.each([{}, { "color-scheme": "", "map-options": "" }])(
    "leaves both out when missing or empty: %j",
    (attributes) => {
      expect(createdMapSettingsOf(elementWith(attributes))).toEqual({
        colorScheme: undefined,
        mapOptions: undefined,
      });
    },
  );

  it("refuses Google's spelling of a colour scheme, naming the attribute", () =>
    refusal(
      { "color-scheme": "DARK" },
      "color-scheme",
      'must be one of "light", "dark", "follow-system", got "DARK"',
    ));

  it.each([
    ["{bad", '"{bad"'],
    ["[1]", "an array"],
    ['"dark"', '"dark"'],
  ])("refuses map-options that aren't a JSON object: %s", (written, got) =>
    refusal({ "map-options": written }, "map-options", `must be a JSON object, got ${got}`),
  );

  it.each([
    ["center", "is set by the store's view"],
    ["zoom", "is set by the store's view"],
    ["styles", "is not offered: style the map in Cloud Console, through its map ID"],
    ["mapId", "is its own attribute: map-id"],
    ["colorScheme", "is its own attribute: color-scheme"],
  ])("keeps %s out of map-options, saying where it goes", (key, remark) =>
    refusal({ "map-options": JSON.stringify({ [key]: 1 }) }, `map-options.${key}`, remark),
  );
});
