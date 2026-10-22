import { afterEach, describe, expect, it, vi } from "vitest";
import { clusteredMarkers } from "./clustered-markers";
import { loadClustering, noClustering } from "./clustering";

afterEach(() => {
  vi.doUnmock("./clustered-markers");
  vi.resetModules();
});

/** `loadClustering` from a fresh module graph, its clustered markers failing to load with `cause`. */
async function loaderFailingWith(cause: Error) {
  vi.resetModules();
  vi.doMock("./clustered-markers", () => {
    throw cause;
  });
  const { loadClustering: loadAnew } = await import("./clustering");
  return loadAnew;
}

describe("loadClustering", () => {
  it("gives every marker its own place without clustering, and the clustered markers with it", async () => {
    expect(await loadClustering(false)).toBe(noClustering);
    expect(await loadClustering(true)).toBe(clusteredMarkers);
  });

  it("fails the load when clustering can't be loaded", async () => {
    const offline = new Error("offline");
    const load = await loaderFailingWith(offline);
    await expect(load(true)).rejects.toMatchObject({
      code: "provider-load-failed",
      message: "mount: maplace's clustering failed to load",
      // Vitest hands the import the module's failure as the cause of its own.
      cause: expect.objectContaining({ cause: offline }),
    });
  });
});

describe("noClustering", () => {
  it("never folds a marker, and never asks for a send when the camera settles", () => {
    const clustering = noClustering(undefined as never, undefined as never);
    const member = {
      id: "a",
      at: () => ({ lat: 0, lng: 0 }),
      fold: vi.fn(() => true),
      unfold: vi.fn(() => true),
    };
    clustering.place(member, { visible: true, state: { selected: false, hovered: false } });
    clustering.flush();
    expect(clustering.cameraSettled()).toBe(false);
    expect(member.fold).not.toHaveBeenCalled();
  });
});
