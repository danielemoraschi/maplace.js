import { type CameraMove, type CameraSite, cameraMove } from "../../adapter-kit/camera-move";
import { hasSize, sameSize } from "../../adapter-kit/map-size";
import { boundsAround, type Camera, fitBox, type MapSize } from "../../adapter-kit/web-mercator";
import type { ResolvedView, Viewport } from "../../viewport";

/**
 * The fake map's camera. `show` only records the view asked for: a `location` view may name an
 * id still being drawn. The view is resolved when the map settles, which is also when a real
 * map reports where it ended up. Like a real map, it reports the view it opens at once it first
 * settles, unless a view sent before then replaced it. A map with no size (hidden) settles
 * nothing; once it has one, or a new one, the last view shown is shown again at that size (a
 * fake map has no user moves, so that view always stands).
 */
export interface FakeCamera {
  show(view: ResolvedView): void;
  /** The viewport the last settled move ended at; undefined when nothing moved since. */
  settle(geometryOf: CameraSite["geometryOf"]): Viewport | undefined;
}

const OPENING_VIEW = { kind: "center", center: { lat: 0, lng: 0 }, zoom: 1 } as const;

export function createCamera(sizeNow: () => MapSize): FakeCamera {
  let camera: Camera = OPENING_VIEW;
  let pending: ResolvedView | undefined = OPENING_VIEW;
  let shown: { readonly view: ResolvedView; readonly size: MapSize } | undefined;

  function cameraAfter(move: CameraMove, size: MapSize): Camera {
    switch (move.kind) {
      case "fit":
        return fitBox(move.bounds, { size, padding: move.padding });
      case "jump":
        return { center: move.center, zoom: move.zoom };
      case "pan":
        return { center: move.center, zoom: camera.zoom };
    }
  }

  return {
    show(view) {
      pending = view;
    },
    settle(geometryOf) {
      const size = sizeNow();
      if (!hasSize(size)) return undefined;
      if (pending === undefined && shown && !sameSize(shown.size, size)) pending = shown.view;
      if (pending === undefined) return undefined;
      const move = cameraMove(pending, { geometryOf, size: () => size });
      if (move === undefined) return undefined;
      shown = { view: pending, size };
      pending = undefined;
      camera = cameraAfter(move, size);
      return { ...camera, bounds: boundsAround(camera, size) };
    },
  };
}
