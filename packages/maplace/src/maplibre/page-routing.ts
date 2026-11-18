import type { Journey } from "../adapter-kit/journey";
import { routeFailed, withTotals } from "../adapter-kit/route-result";
import type { ComputedRoute } from "../adapter-kit/routing";
import { legStops, type RouteResult, runsThrough } from "../route";
import { type RouteAnswer, type RouteComputer, requestStopsOf } from "../route-request";
import { root } from "../validate/fail";
import { checkRouteAnswer } from "../validate/route-answer";

const ANSWER_FIELD = root("computeRoute's answer");

/**
 * Computes with the page's `computeRoute`, checking its answer at the boundary: a rejection, a
 * throw, an answer that isn't a route, or legs that don't run between the stops that end legs each
 * fail the route (`route-failed`) with what went wrong as its cause. The totals are the legs'; the
 * store keeps its own copy of what it reads.
 */
export function pageCompute(computeRoute: RouteComputer) {
  return async (journey: Journey, signal: AbortSignal): Promise<ComputedRoute> => {
    let answer: unknown;
    try {
      answer = await computeRoute({
        stops: requestStopsOf(journey, journey.points),
        travelMode: journey.travelMode ?? "driving",
        avoid: journey.avoid ?? [],
        signal,
      });
    } catch (cause) {
      throw routeFailed("computeRoute failed", cause);
    }
    return { result: resultOf(checked(answer), journey) };
  };
}

/** The answer, once it is a route; anything else fails the route, the check's error its cause. */
function checked(answer: unknown): RouteAnswer {
  try {
    checkRouteAnswer(answer, ANSWER_FIELD);
    return answer;
  } catch (cause) {
    throw routeFailed("computeRoute answered no route", cause);
  }
}

/** The answer as a result: its legs between the stops that end legs, totalled. */
function resultOf({ legs, path }: RouteAnswer, journey: Journey): RouteResult {
  if (!runsThrough(legs, journey)) {
    const ends = legStops(journey).join(" → ");
    throw routeFailed(`computeRoute's legs don't run between the stops that end legs (${ends})`);
  }
  return withTotals(legs, path);
}
