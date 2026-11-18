import { sum, withTotals } from "../adapter-kit/route-result";
import type { LatLng } from "../geometry";
import type { RouteLeg, RouteResult, RouteStep, TravelMode } from "../route";
import type { RouteComputer, RouteRequestStop } from "../route-request";
import { metresBetween } from "../sphere";

/** Metres per second for each travel mode: a straight line at a steady speed. */
const SPEED_BY_MODE: Readonly<Record<TravelMode, number>> = {
  driving: 14,
  bicycling: 5,
  walking: 1.4,
  transit: 10,
};

/**
 * A routing function for tests and the fake: a straight line through the stops, answered at once.
 * It stands in for a page's own routing (`createMapLibreAdapter({ computeRoute })`).
 */
export const straightRoutes: RouteComputer = async ({ stops, travelMode }) =>
  straightRoute(stops, travelMode);

/**
 * A straight-line route through the stops: one step per stretch between two stops, and a leg
 * ending at every stop the route doesn't pass through.
 */
export function straightRoute(
  stops: readonly RouteRequestStop[],
  travelMode: TravelMode | undefined,
): RouteResult {
  const speed = SPEED_BY_MODE[travelMode ?? "driving"];
  const legs: RouteLeg[] = [];
  let legFrom = stops[0] as RouteRequestStop;
  let steps: RouteStep[] = [];
  for (const [index, stop] of stops.entries()) {
    if (index === 0) continue;
    steps.push(straightStep(stops[index - 1] as RouteRequestStop, stop, speed));
    if (!stop.via || index === stops.length - 1) {
      legs.push(legOf(legFrom.id, stop.id, steps));
      legFrom = stop;
      steps = [];
    }
  }
  return withTotals(legs, stops.map(pointOf));
}

/** Straight on to the stop `to`, at `speed` metres per second. */
function straightStep(from: LatLng, to: RouteRequestStop, speed: number): RouteStep {
  const distanceMeters = metresBetween(from, to);
  return {
    instruction: `Head straight for "${to.id}"`,
    distanceMeters,
    durationSeconds: distanceMeters / speed,
  };
}

/** A leg from `from` to `to`, as long as its steps together. */
function legOf(from: string, to: string, steps: readonly RouteStep[]): RouteLeg {
  return {
    from,
    to,
    distanceMeters: sum(steps.map((step) => step.distanceMeters)),
    durationSeconds: sum(steps.map((step) => step.durationSeconds)),
    steps,
  };
}

function pointOf({ lat, lng }: LatLng): LatLng {
  return { lat, lng };
}
