// @vitest-environment happy-dom
import { describe, expect, it, onTestFinished } from "vitest";
import { defineBuiltInProvider } from "./built-in-provider";
import type { ProviderFactory } from "./index";
import { loadSourceNamedBy, mapSettingsReadBy } from "./provider-description";
import { onProviderRegistered } from "./providers";

describe("defineBuiltInProvider", () => {
  it("describes the provider before a map waiting for it opens", () => {
    const factory: ProviderFactory = () => {
      throw new Error("not built in this test");
    };
    const loadSource = () => "Somewhere";
    let seen: readonly string[] | undefined;
    let seenSource: unknown;
    // Stands in for a waiting map's setup retry, registered the same way.
    const stop = onProviderRegistered(() => {
      seen = mapSettingsReadBy(factory);
      seenSource = loadSourceNamedBy(factory);
    });
    onTestFinished(stop);
    defineBuiltInProvider("built-in-test", factory, { mapSettings: ["map-style"], loadSource });
    expect(seen).toEqual(["map-style"]);
    expect(seenSource).toBe(loadSource);
  });
});
