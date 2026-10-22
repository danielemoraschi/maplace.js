import { describe, expect, it, vi } from "vitest";
import { mapsSettingsCheck } from "./maps-settings-check.ts";

describe("mapsSettingsCheck", () => {
  const warningsOf = (command: "build" | "dev", env: Record<string, string>) => {
    const logger = { warn: vi.fn() };
    const config = { root: new URL("file:///site/") };
    mapsSettingsCheck(() => env).hooks["astro:config:setup"]({ command, config, logger });
    return logger.warn.mock.calls.map(([message]) => message);
  };

  it("warns on a build without a key, or with an empty one", () => {
    expect(warningsOf("build", { SITE_MAPS_MAP_ID: "m" })).toEqual([
      expect.stringMatching(/SITE_MAPS_KEY.*each Google map/),
    ]);
    expect(warningsOf("build", { SITE_MAPS_KEY: "", SITE_MAPS_MAP_ID: "m" })).toHaveLength(1);
  });

  it("warns on a build without a map ID: its maps would run on Google's demo one", () => {
    expect(warningsOf("build", { SITE_MAPS_KEY: "k" })).toEqual([
      expect.stringMatching(/SITE_MAPS_MAP_ID.*DEMO_MAP_ID/),
    ]);
  });

  it("says nothing on a build with a key and a map ID", () => {
    expect(warningsOf("build", { SITE_MAPS_KEY: "a-key", SITE_MAPS_MAP_ID: "m" })).toEqual([]);
  });

  it("stays quiet in dev, where a missing key is the usual case", () => {
    expect(warningsOf("dev", {})).toEqual([]);
  });

  it("reads the variables at the site's root", () => {
    const env = vi.fn(() => ({ SITE_MAPS_KEY: "k" }));
    const config = { root: new URL("file:///site/") };
    mapsSettingsCheck(env).hooks["astro:config:setup"]({
      command: "build",
      config,
      logger: { warn() {} },
    });
    expect(env).toHaveBeenCalledWith("/site/");
  });
});
