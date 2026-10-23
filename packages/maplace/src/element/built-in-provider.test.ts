// @vitest-environment happy-dom
import { describe, expect, it, onTestFinished } from "vitest";
import { defineBuiltInProvider } from "./built-in-provider";
import type { ProviderFactory } from "./index";
import type { MapSettingAttribute } from "./map-settings-watch";
import { mapSettingsReadBy } from "./provider-map-settings";
import { onProviderRegistered } from "./providers";

describe("defineBuiltInProvider", () => {
  it("names the provider's map settings before a map waiting for it opens", () => {
    const factory: ProviderFactory = () => {
      throw new Error("not built in this test");
    };
    let seen: readonly MapSettingAttribute[] | undefined;
    // Stands in for a waiting map's setup retry, registered the same way.
    const stop = onProviderRegistered(() => {
      seen = mapSettingsReadBy(factory);
    });
    onTestFinished(stop);
    defineBuiltInProvider("built-in-test", factory, ["map-style"]);
    expect(seen).toEqual(["map-style"]);
  });
});
