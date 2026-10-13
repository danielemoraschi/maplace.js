import type { LatLng } from "../../geometry";
import type { ResolvedView, Viewport } from "../../viewport";
import type { MapSize } from "../map-probe";
import { boundsAround, type Camera, fitBox } from "./mercator";

/** Where a location is pinned, if the map has it yet. */
export type AnchorOf = (id: string) => LatLng | undefined;

/**
 * The fake map's camera. `show` only records the view asked for: a `location` view may name an
 * id still being drawn. The view is resolved when the map settles, which is also when a real
 * map reports where it ended up.
 */
export interface FakeCamera {
  show(view: ResolvedView): void;
  /** The viewport the last settled move ended at; undefined when nothing moved since. */
  settle(anchorOf: AnchorOf): Viewport | undefined;
}

const START: Camera = { center: { lat: 0, lng: 0 }, zoom: 1 };

export function createCamera(size: MapSize): FakeCamera {
  let camera = START;
  let pending: ResolvedView | undefined;

  function cameraFor(view: ResolvedView, anchorOf: AnchorOf): Camera | undefined {
    switch (view.kind) {
      case "fit-bounds":
        return fitBox(view.bounds, { size, padding: view.padding });
      case "center":
        return { center: view.center, zoom: view.zoom };
      case "location": {
        const anchor = anchorOf(view.id);
        return anchor && { center: anchor, zoom: view.zoom ?? camera.zoom };
      }
    }
  }

  return {
    show(view) {
      pending = view;
    },
    settle(anchorOf) {
      const next = pending && cameraFor(pending, anchorOf);
      if (next === undefined) return undefined;
      pending = undefined;
      camera = next;
      return { ...camera, bounds: boundsAround(camera, size) };
    },
  };
}
