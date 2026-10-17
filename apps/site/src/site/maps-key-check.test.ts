import { describe, expect, it, vi } from "vitest";
import { mapsKeyCheck } from "./maps-key-check.ts";

describe("mapsKeyCheck", () => {
  const warningsOf = (command: "build" | "dev", env: Record<string, string>) => {
    const logger = { warn: vi.fn() };
    const config = { root: new URL("file:///site/") };
    mapsKeyCheck(() => env).hooks["astro:config:setup"]({ command, config, logger });
    return logger.warn.mock.calls.map(([message]) => message);
  };

  it("warns on a build without a key, or with an empty one", () => {
    expect(warningsOf("build", {})).toEqual([expect.stringMatching(/SITE_MAPS_KEY/)]);
    expect(warningsOf("build", { SITE_MAPS_KEY: "" })).toHaveLength(1);
  });

  it("says nothing on a build with a key", () => {
    expect(warningsOf("build", { SITE_MAPS_KEY: "a-key" })).toEqual([]);
  });

  it("stays quiet in dev, where a missing key is the usual case", () => {
    expect(warningsOf("dev", {})).toEqual([]);
  });

  it("reads the variables at the site's root", () => {
    const env = vi.fn(() => ({ SITE_MAPS_KEY: "k" }));
    const config = { root: new URL("file:///site/") };
    mapsKeyCheck(env).hooks["astro:config:setup"]({
      command: "build",
      config,
      logger: { warn() {} },
    });
    expect(env).toHaveBeenCalledWith("/site/");
  });
});
