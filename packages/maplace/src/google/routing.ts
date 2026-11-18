/// <reference types="google.maps" preserve="true" />

import { createRouting, type Routing } from "../adapter-kit/routing";
import type { Drawing } from "./drawing";
import type { GoogleMapState } from "./map-state";
import { type ComputedGoogleRoute, computeRoute } from "./route-compute";
import { drawRouteLine } from "./route-line";

/**
 * The store's route on Google: computed by Google's Routes, each computation billed, and drawn
 * with Google's own polylines.
 */
export function createGoogleRouting(
  state: GoogleMapState,
  drawing: Pick<Drawing, "applied" | "drawnThrough">,
): Routing {
  return createRouting<ComputedGoogleRoute>(state, drawing, {
    compute: computeRoute,
    drawLine({ google }, style) {
      const mounted = state.mounted;
      return mounted && drawRouteLine(google, style, mounted.map);
    },
    failure: "Google couldn't draw the route",
  });
}
