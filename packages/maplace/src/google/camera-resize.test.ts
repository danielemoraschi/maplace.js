// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { markerDrawable } from "../testing/conformance/fixtures";
import { MAP_SIZE } from "../testing/map-probe";
import { opened } from "./testing/stub-camera";
import { latestResizeObserver } from "./testing/stub-resize-observer";

const A = markerDrawable("a", { lat: 10, lng: 20 });

afterEach(() => vi.unstubAllGlobals());

describe("the Google camera on a hidden or resized map", () => {
  const FIT = {
    kind: "fit-bounds",
    bounds: { south: 10, west: 20, north: 20, east: 35 },
    padding: 40,
  } as const;

  it("waits while the map has no size, and shows the view once it has one", async () => {
    const { map, camera, resize } = opened();
    await resize(0);
    camera.setView(FIT);
    expect(map.fitBounds).not.toHaveBeenCalled();
    await resize(MAP_SIZE.width);
    expect(map.fitBounds).toHaveBeenCalledOnce();
  });

  it("shows the standing view again on each resize", async () => {
    const { map, camera, resize } = opened();
    camera.setView(FIT);
    await resize(256);
    await resize(512);
    expect(map.fitBounds).toHaveBeenCalledTimes(3);
  });

  it("keeps what the user chose on a resize after they moved the map", async () => {
    const { map, camera, resize } = opened();
    camera.setView(FIT);
    map.userInput();
    map.trigger("center_changed");
    await resize(256);
    expect(map.fitBounds).toHaveBeenCalledOnce();
  });

  it("keeps a view still waiting for its location through a resize", async () => {
    const { map, camera, resize, place } = opened();
    camera.setView({ kind: "location", id: "a", zoom: undefined });
    await resize(256);
    place(A);
    expect(map.panTo).toHaveBeenCalledOnce();
  });

  it("stops watching the map on destroy", async () => {
    const { map, camera, resize, destroy } = opened();
    camera.setView(FIT);
    destroy();
    expect(latestResizeObserver().observed).toBe(false);
    await resize(256);
    expect(map.fitBounds).toHaveBeenCalledOnce();
  });
});
