// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { FIT_MAX_ZOOM } from "../adapter-kit/camera-move";
import {
  markerDrawable,
  polygonDrawable,
  reshaped,
  squareAround,
} from "../testing/conformance/fixtures";
import { cameraOnStubs, opened } from "./testing/stub-camera";

afterEach(() => vi.unstubAllGlobals());

const A = markerDrawable("a", { lat: 10, lng: 20 });

describe("the Google camera", () => {
  it("jumps to a centre and zoom", () => {
    const { map, camera } = opened();
    camera.setView({ kind: "center", center: { lat: 1, lng: 2 }, zoom: 4 });
    expect(map.moveCamera).toHaveBeenCalledWith({ center: { lat: 1, lng: 2 }, zoom: 4 });
  });

  it("pans to a location at the zoom it has, and jumps there with a zoom", () => {
    const { map, camera, place } = opened();
    place(A);
    camera.setView({ kind: "location", id: "a", zoom: undefined });
    expect(map.panTo).toHaveBeenCalledWith({ lat: 10, lng: 20 });
    camera.setView({ kind: "location", id: "a", zoom: 7 });
    expect(map.moveCamera).toHaveBeenCalledWith({ center: { lat: 10, lng: 20 }, zoom: 7 });
    expect(map.panTo).toHaveBeenCalledOnce();
  });

  it("moves to a location named before it was placed once it is, and only once", () => {
    const { map, camera, place, update } = opened();
    camera.setView({ kind: "location", id: "a", zoom: undefined });
    camera.sync();
    expect(map.panTo).not.toHaveBeenCalled();
    place(A);
    expect(map.panTo).toHaveBeenCalledWith({ lat: 10, lng: 20 });
    update(markerDrawable("a", { lat: 30, lng: 40 }));
    camera.sync();
    expect(map.panTo).toHaveBeenCalledOnce();
  });

  it("reads a location once the diffs sent before the view are drawn, not those after", () => {
    const { map, camera, place, drawing } = opened();
    place(A);
    drawing.applied = 1;
    camera.setView({ kind: "location", id: "a", zoom: undefined });
    expect(map.panTo).not.toHaveBeenCalled();
    drawing.applied = 5;
    drawing.drawn = 1;
    camera.sync();
    expect(map.panTo).toHaveBeenCalledWith({ lat: 10, lng: 20 });
  });

  it("drops a waiting location view for a newer view", () => {
    const { map, camera, place } = opened();
    camera.setView({ kind: "location", id: "a", zoom: undefined });
    camera.setView({ kind: "center", center: { lat: 0, lng: 0 }, zoom: 3 });
    place(A);
    expect(map.panTo).not.toHaveBeenCalled();
    expect(map.moveCamera).toHaveBeenCalledOnce();
  });

  it("brings a shape to its centre point", () => {
    const { map, camera, place } = opened();
    const path = squareAround({ lat: 15, lng: 25 }, 10);
    place(reshaped(polygonDrawable("field"), { type: "polygon", path, holes: [] }));
    camera.setView({ kind: "location", id: "field", zoom: undefined });
    expect(map.panTo).toHaveBeenCalledWith({ lat: 15, lng: 25 });
  });

  it("leaves a box to Google's fit, and centres one it would zoom past the cap at the cap", () => {
    const { map, camera } = opened();
    const box = { south: -20, west: 170, north: 0, east: -170 };
    camera.setView({ kind: "fit-bounds", bounds: box, padding: 40 });
    expect(map.fitBounds).toHaveBeenCalledWith(box, 40);
    const point = { south: 10, west: 20, north: 10, east: 20 };
    camera.setView({ kind: "fit-bounds", bounds: point, padding: 40 });
    expect(map.moveCamera).toHaveBeenCalledWith({
      center: { lat: expect.closeTo(10), lng: 20 },
      zoom: FIT_MAX_ZOOM,
    });
  });

  it("shows a view sent before the map opened once it opens, and none after destroy", () => {
    const { map, camera, open, destroy } = cameraOnStubs();
    camera.setView({ kind: "center", center: { lat: 1, lng: 2 }, zoom: 4 });
    expect(map.moveCamera).not.toHaveBeenCalled();
    open();
    expect(map.moveCamera).toHaveBeenCalledOnce();
    destroy();
    camera.setView({ kind: "center", center: { lat: 5, lng: 6 }, zoom: 4 });
    expect(map.moveCamera).toHaveBeenCalledOnce();
  });
});
