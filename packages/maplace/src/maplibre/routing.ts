import { type ComputedRoute, createRouting, type Routing } from "../adapter-kit/routing";
import type { RouteComputer } from "../route-request";
import type { Drawing } from "./drawing";
import type { MapLibreState } from "./map-state";
import { pageCompute } from "./page-routing";
import { drawRouteLine } from "./route-line";

/**
 * The store's route on MapLibre, which has no routing of its own: computed by the page's
 * `computeRoute`, its answer checked, and drawn in the route source under every location.
 */
export function createMapLibreRouting(
  state: MapLibreState,
  drawing: Pick<Drawing, "applied" | "drawnThrough">,
  computeRoute: RouteComputer,
): Routing {
  return createRouting<ComputedRoute>(state, drawing, {
    compute: pageCompute(computeRoute),
    drawLine({ result }, style) {
      const routes = state.features?.route;
      return routes && drawRouteLine(result.path, style, routes);
    },
    failure: "the route couldn't be drawn",
  });
}
