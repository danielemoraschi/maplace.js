import { describe, expect, it } from "vitest";
import { child, root } from "../validate/fail";
import { checkGoogleOptions, mapOptionsCheck } from "./options";

const pageMap = { getDiv: () => ({ nodeType: 1 }) };

function refusal(options: unknown, field: string, message: string) {
  return () =>
    expect(() => checkGoogleOptions(options)).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        field,
        message: `createGoogleAdapter: ${message}`,
      }),
    );
}

describe("checkGoogleOptions", () => {
  it("accepts a map ID alone, every option, and options given as undefined", () => {
    expect(() => checkGoogleOptions({ mapId: "DEMO_MAP_ID" })).not.toThrow();
    const created = { colorScheme: "dark", mapOptions: { disableDefaultUI: true } };
    expect(() => checkGoogleOptions({ mapId: "DEMO_MAP_ID", ...created })).not.toThrow();
    expect(() => checkGoogleOptions({ mapId: "DEMO_MAP_ID", map: pageMap })).not.toThrow();
    const absent = { colorScheme: undefined, map: undefined, mapOptions: undefined };
    expect(() => checkGoogleOptions({ mapId: "DEMO_MAP_ID", ...absent })).not.toThrow();
  });

  it(
    "needs an object with a map ID",
    refusal(undefined, "options", "options must be an object with a mapId, got undefined"),
  );

  it(
    "needs a map ID that isn't empty",
    refusal({ mapId: "" }, "options.mapId", 'options.mapId must be a non-empty string, got ""'),
  );

  it(
    "takes maplace's colour scheme names, not Google's",
    refusal(
      { mapId: "id", colorScheme: "DARK" },
      "options.colorScheme",
      'options.colorScheme must be one of "light", "dark", "follow-system", got "DARK"',
    ),
  );

  it(
    "names an unknown option, and where map options go",
    refusal(
      { mapId: "id", google: {} },
      "options.google",
      "options.google is not an option: Google's map options go in mapOptions",
    ),
  );

  it.each([
    ["center", "is set by the store's view"],
    ["zoom", "is set by the store's view"],
    ["mapId", "is its own option: createGoogleAdapter({ mapId })"],
    ["colorScheme", "is its own option: createGoogleAdapter({ colorScheme })"],
    ["styles", "is not offered: style the map in Cloud Console, through its map ID"],
  ])("keeps %s out of mapOptions", (key, remark) =>
    refusal(
      { mapId: "id", mapOptions: { [key]: 1 } },
      `options.mapOptions.${key}`,
      `options.mapOptions.${key} ${remark}`,
    )(),
  );

  it.each([
    ["an object without one", {}],
    ["one whose element isn't an element", { getDiv: () => ({ nodeType: 3 }) }],
  ])("takes only a Google map as the page's map, not %s", (_, map) =>
    refusal(
      { mapId: "id", map },
      "options.map",
      "options.map must be a Google map (google.maps.Map), got an object",
    )(),
  );

  it("takes a page's map Google disabled (no element), whose load then fails as refused", () => {
    expect(() =>
      checkGoogleOptions({ mapId: "id", map: { getDiv: () => undefined } }),
    ).not.toThrow();
  });

  it.each([
    ["mapOptions", { disableDefaultUI: true }],
    ["colorScheme", "dark"],
  ])("refuses %s with the page's own map, which keeps its own", (key, value) =>
    refusal(
      { mapId: "id", map: pageMap, [key]: value },
      `options.${key}`,
      `options.${key} is for a map maplace creates: set it on your own map`,
    )(),
  );
});

describe("mapOptionsCheck", () => {
  const field = child(root("caller"), "settings");
  const check = mapOptionsCheck({ mapId: "goes in A", colorScheme: "goes in B" }, "a JSON object");

  it.each([
    ["mapId", "goes in A"],
    ["colorScheme", "goes in B"],
  ])("says where %s goes in the caller's own words", (key, remark) => {
    expect(() => check({ [key]: 1 }, field)).toThrow(
      expect.objectContaining({
        field: `settings.${key}`,
        message: `caller: settings.${key} ${remark}`,
      }),
    );
  });

  it("names what the caller expects instead of a non-object", () => {
    expect(() => check([1], field)).toThrow(
      expect.objectContaining({ message: "caller: settings must be a JSON object, got an array" }),
    );
  });
});
