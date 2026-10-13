import { afterEach, describe, expect, it, vi } from "vitest";
import { loadLibrary } from "./libraries";

afterEach(() => {
  vi.unstubAllGlobals();
});

const missingMaps = expect.objectContaining({
  code: "provider-load-failed",
  message: expect.stringContaining("google.maps.importLibrary is missing"),
});

describe("loadLibrary", () => {
  it("fails to load, naming the fix, without Maps JS on the page", async () => {
    await expect(loadLibrary("maps")).rejects.toThrow(missingMaps);
  });

  it("fails to load with a Maps JS too old to import libraries", async () => {
    vi.stubGlobal("google", { maps: {} });
    await expect(loadLibrary("maps")).rejects.toThrow(missingMaps);
  });

  it("asks the page's Maps JS for the library by name", async () => {
    const maps = { Map: class {} };
    const importLibrary = vi.fn(async () => maps);
    vi.stubGlobal("google", { maps: { importLibrary } });
    await expect(loadLibrary("maps")).resolves.toBe(maps);
    expect(importLibrary).toHaveBeenCalledWith("maps");
  });
});
