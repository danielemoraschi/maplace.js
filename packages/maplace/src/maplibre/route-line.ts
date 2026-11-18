import { lineParts } from "../adapter-kit/line-parts";
import type { RouteLine, RouteLook } from "../adapter-kit/routing";
import { ROUTE_LINE_RANK } from "../adapter-kit/stacking";
import type { LatLng } from "../geometry";
import type { FeatureSet } from "./feature-set";
import { ROUTE_DEFAULTS } from "./line-paint";
import { putParts, removeParts } from "./line-parts";

/** The route's own name for its line, which its features carry as their id. */
const ROUTE_ID = "route";

/** The route's features' keys in the route source: its line or the part ahead, and the part travelled. */
const KEYS = { ahead: ROUTE_ID, travelled: "route-travelled" } as const;

const PROPERTIES = { id: ROUTE_ID, rank: ROUTE_LINE_RANK } as const;

/**
 * The route through `path` in the route source, in its look, the route layer's for the rest:
 * whole, or while a progress is set, its travelled part faded from the route's opacity and the
 * part ahead as the route.
 */
export function drawRouteLine(
  path: readonly LatLng[],
  look: RouteLook,
  routes: FeatureSet,
): RouteLine {
  function show({ style, progress, travelledStyle }: RouteLook): void {
    const parts =
      progress === undefined
        ? { ahead: { path, style }, travelled: undefined }
        : lineParts(path, { style, progress, travelledStyle }, ROUTE_DEFAULTS.strokeOpacity);
    putParts(routes, KEYS, parts, PROPERTIES);
    void routes.flush();
  }

  show(look);
  return {
    restyle: show,
    remove() {
      removeParts(routes, KEYS);
      void routes.flush();
    },
  };
}
