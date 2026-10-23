import { describe, expect, it } from "vitest";
import type { ProviderFactory } from "./index";
import { MAP_SETTINGS } from "./map-settings-watch";
import { mapSettingsReadBy, nameMapSettings } from "./provider-map-settings";

/** A provider of its own, never called: only its identity matters here. */
const aProvider = (): ProviderFactory => () => {
  throw new Error("not built in these tests");
};

describe("mapSettingsReadBy", () => {
  it("gives the settings a provider named", () => {
    const provider = aProvider();
    nameMapSettings(provider, ["map-style", "map-options"]);
    expect(mapSettingsReadBy(provider)).toEqual(["map-style", "map-options"]);
  });

  it("gives every map setting for a provider that named none", () => {
    expect(mapSettingsReadBy(aProvider())).toEqual(["color-scheme", "map-style", "map-options"]);
    expect(mapSettingsReadBy(aProvider())).toBe(MAP_SETTINGS);
  });
});
