import { describe, expect, it } from "vitest";
import type { ProviderFactory } from "./index";
import { MAP_SETTINGS } from "./map-settings-watch";
import { describeProvider, loadSourceNamedBy, mapSettingsReadBy } from "./provider-description";

/** A provider of its own, never called: only its identity matters here. */
const aProvider = (): ProviderFactory => () => {
  throw new Error("not built in these tests");
};

const NO_ONE = () => undefined;

describe("mapSettingsReadBy", () => {
  it("gives the settings a provider named", () => {
    const provider = aProvider();
    describeProvider(provider, { mapSettings: ["map-style", "map-options"], loadSource: NO_ONE });
    expect(mapSettingsReadBy(provider)).toEqual(["map-style", "map-options"]);
  });

  it("gives every map setting for a provider that named none", () => {
    expect(mapSettingsReadBy(aProvider())).toEqual(["color-scheme", "map-style", "map-options"]);
    expect(mapSettingsReadBy(aProvider())).toBe(MAP_SETTINGS);
  });
});

describe("loadSourceNamedBy", () => {
  it("gives the load source a provider named", () => {
    const provider = aProvider();
    describeProvider(provider, { mapSettings: [], loadSource: NO_ONE });
    expect(loadSourceNamedBy(provider)).toBe(NO_ONE);
  });

  it("gives none for a provider that named none", () => {
    expect(loadSourceNamedBy(aProvider())).toBeUndefined();
  });
});
