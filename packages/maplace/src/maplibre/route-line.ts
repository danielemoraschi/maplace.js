import type { RouteLine } from "../adapter-kit/routing";
import { ROUTE_LINE_RANK } from "../adapter-kit/stacking";
import type { LatLng } from "../geometry";
import type { LineStyle } from "../style";
import type { FeatureSet } from "./feature-set";
import { definedFields, lineGeometryOf } from "./location-features";

/** The route's one feature in the route source. */
const ROUTE_ID = "route";

/** The route through `path` in the route source, in its style, the route layer's for the rest. */
export function drawRouteLine(
  path: readonly LatLng[],
  style: LineStyle | undefined,
  routes: FeatureSet,
): RouteLine {
  const geometry = lineGeometryOf(path);

  function put(next: LineStyle | undefined): void {
    routes.put({
      type: "Feature",
      geometry,
      properties: { id: ROUTE_ID, rank: ROUTE_LINE_RANK, ...definedFields(next) },
    });
    void routes.flush();
  }

  put(style);
  return {
    restyle: put,
    remove() {
      routes.remove(ROUTE_ID);
      void routes.flush();
    },
  };
}
