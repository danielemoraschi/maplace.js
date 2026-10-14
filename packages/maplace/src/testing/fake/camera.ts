import { type CameraMove, type CameraSite, cameraMove } from "../../adapter-kit/camera-move";
import { boundsAround, type Camera, fitBox, type MapSize } from "../../adapter-kit/web-mercator";
import type { ResolvedView, Viewport } from "../../viewport";

/**
 * The fake map's camera. `show` only records the view asked for: a `location` view may name an
 * id still being drawn. The view is resolved when the map settles, which is also when a real
 * map reports where it ended up. Like a real map, it reports the view it opens at once it first
 * settles, unless a view sent before then replaced it.
 */
export interface FakeCamera {
  show(view: ResolvedView): void;
  /** The viewport the last settled move ended at; undefined when nothing moved since. */
  settle(geometryOf: CameraSite["geometryOf"]): Viewport | undefined;
}

const OPENING_VIEW = { kind: "center", center: { lat: 0, lng: 0 }, zoom: 1 } as const;

export function createCamera(size: MapSize): FakeCamera {
  let camera: Camera = OPENING_VIEW;
  let pending: ResolvedView | undefined = OPENING_VIEW;

  function cameraAfter(move: CameraMove): Camera {
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
      const move = pending && cameraMove(pending, { geometryOf, size: () => size });
      if (move === undefined) return undefined;
      pending = undefined;
      camera = cameraAfter(move);
      return { ...camera, bounds: boundsAround(camera, size) };
    },
  };
}
