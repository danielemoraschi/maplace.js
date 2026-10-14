import { afterEach, describe, expect, it, vi } from "vitest";
import { loadLibraries } from "./libraries";

afterEach(() => {
  vi.unstubAllGlobals();
});

const missingMaps = expect.objectContaining({
  code: "provider-load-failed",
  message: expect.stringContaining("google.maps.importLibrary is missing"),
});

describe("loadLibraries", () => {
  it("fails to load, naming the fix, without Maps JS on the page", async () => {
    await expect(loadLibraries()).rejects.toThrow(missingMaps);
  });

  it("fails to load with a Maps JS too old to import libraries", async () => {
    vi.stubGlobal("google", { maps: {} });
    await expect(loadLibraries()).rejects.toThrow(missingMaps);
  });

  it("asks the page's Maps JS for every library the adapter draws with", async () => {
    const importLibrary = vi.fn(async (name: string) => ({ name }));
    vi.stubGlobal("google", { maps: { importLibrary } });
    await expect(loadLibraries()).resolves.toEqual({
      maps: { name: "maps" },
      marker: { name: "marker" },
    });
    expect(importLibrary.mock.calls).toEqual([["maps"], ["marker"]]);
  });
});
