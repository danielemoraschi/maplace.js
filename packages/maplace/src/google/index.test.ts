import { afterEach, describe, expect, it, vi } from "vitest";
import { createMaplace } from "../maplace/create";
import { CONTAINER } from "../testing/container";
import * as entry from "./index";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("maplace/google", () => {
  it("imports and makes an adapter with no DOM and no Google Maps loaded", () => {
    expect(Object.keys(entry)).toEqual(["createGoogleAdapter"]);
    expect(typeof globalThis.document).toBe("undefined");
    expect(entry.createGoogleAdapter({ mapId: "DEMO_MAP_ID" }).capabilities).toBeInstanceOf(Set);
  });

  it("throws on misuse when the adapter is made", () => {
    expect(() => entry.createGoogleAdapter({ mapId: "" })).toThrow(
      expect.objectContaining({ code: "invalid-input", field: "options.mapId" }),
    );
  });

  it("fails the load, naming the fix, when the page hasn't loaded Maps JS", async () => {
    const maplace = createMaplace();
    const errors = vi.fn();
    maplace.on("error", errors);
    const ready = maplace.whenReady();
    maplace.attach(entry.createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), CONTAINER);
    await expect(ready).rejects.toThrow("google.maps.importLibrary is missing");
    expect(maplace.getSnapshot().loadState).toBe("error");
    expect(errors.mock.calls[0]?.[0].error).toMatchObject({ code: "provider-load-failed" });
  });

  it("fails the load when Maps JS can't load a library, keeping Google's error", async () => {
    const blocked = new Error("The Google Maps JavaScript API could not load.");
    vi.stubGlobal("google", { maps: { importLibrary: () => Promise.reject(blocked) } });
    const maplace = createMaplace();
    const ready = maplace.whenReady();
    maplace.attach(entry.createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), CONTAINER);
    await expect(ready).rejects.toMatchObject({ code: "provider-load-failed", cause: blocked });
    expect(maplace.getSnapshot().loadState).toBe("error");
  });

  it("names the page's map element, for attach to check the container holds it", () => {
    const map = { getDiv: () => CONTAINER } as unknown as google.maps.Map;
    expect(entry.createGoogleAdapter({ mapId: "id", map }).pageMapElement).toBe(CONTAINER);
    expect(entry.createGoogleAdapter({ mapId: "id" }).pageMapElement).toBeUndefined();
  });
});
