import { describe, expect, it, vi } from "vitest";
import { type GoogleEntry, googleWithMapId } from "./site-google.ts";

/** `maplace/google`'s two functions, recording the options they are called with. */
function stubGoogle() {
  return {
    createGoogleAdapter: vi.fn(),
    createGoogleMap: vi.fn(),
  } as unknown as GoogleEntry & Record<keyof GoogleEntry, ReturnType<typeof vi.fn>>;
}

describe("googleWithMapId", () => {
  it("makes the adapter with the site's map ID when the example gives none", () => {
    const google = stubGoogle();
    googleWithMapId(google, "site-map").createGoogleAdapter();
    expect(google.createGoogleAdapter).toHaveBeenCalledWith({ mapId: "site-map" });
  });

  it("makes the map with the site's map ID, the example's options kept", () => {
    const google = stubGoogle();
    googleWithMapId(google, "site-map").createGoogleMap("#map", { cluster: true });
    expect(google.createGoogleMap).toHaveBeenCalledWith("#map", {
      mapId: "site-map",
      cluster: true,
    });
  });

  it("keeps the example's own map ID", () => {
    const google = stubGoogle();
    googleWithMapId(google, "site-map").createGoogleAdapter({ mapId: "DEMO_MAP_ID" });
    expect(google.createGoogleAdapter).toHaveBeenCalledWith({ mapId: "DEMO_MAP_ID" });
  });

  it("leaves the functions as they are without a site map ID", () => {
    const google = stubGoogle();
    expect(googleWithMapId(google, undefined)).toBe(google);
  });
});
