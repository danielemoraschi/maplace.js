import type { Drawable } from "../../drawable";
import { MAP_SIZE } from "../../testing/map-probe";
import { createCamera } from "../camera";
import { frames } from "../frames";
import { createMapState } from "../map-state";
import { PLACERS } from "../placers";
import { sizeable } from "./sized-element";
import type { StubMap } from "./stub-libraries";
import { latestResizeObserver, stubResizeObserver } from "./stub-resize-observer";
import { stubSite } from "./stub-site";

/**
 * A camera on a stub map of `MAP_SIZE`, before the map opens (as `mount` does: the state holds
 * the map from just before its parts open until destroy); `place` draws as `apply` would, and
 * `resize` changes the map's size as layout would, its observer calling back.
 */
export function cameraOnStubs() {
  stubResizeObserver();
  const state = createMapState();
  const { mounted, close, site } = stubSite(state);
  state.mounted = undefined;
  const map = mounted.map as unknown as StubMap;
  const size = sizeable(map.getDiv(), MAP_SIZE.width, MAP_SIZE.height);
  /** Diffs the store has applied, and how many of them are drawn. */
  const drawing = { applied: 0, drawn: 0 };
  const camera = createCamera(state, {
    applied: () => drawing.applied,
    drawnThrough: (count) => drawing.drawn >= count,
  });
  return {
    map,
    camera,
    drawing,
    open() {
      state.mounted = mounted;
      camera.part.open(mounted);
      // A real observer calls back once as it starts.
      latestResizeObserver().resized();
    },
    /** The map's new size, once the camera has had the frame it waits for Google to take it in. */
    async resize(width: number) {
      size.width = width;
      latestResizeObserver().resized();
      await frames(4);
    },
    destroy() {
      state.mounted = undefined;
      close();
    },
    place(drawable: Drawable) {
      state.placed.set(drawable.id, PLACERS[drawable.geometry.type](drawable, site));
      camera.sync();
    },
    update: (drawable: Drawable) => state.placed.get(drawable.id)?.update(drawable),
  };
}

export function opened() {
  const parts = cameraOnStubs();
  parts.open();
  return parts;
}
