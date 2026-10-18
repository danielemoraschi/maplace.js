/// <reference types="google.maps" preserve="true" />

import { anchorOf } from "../adapter-kit/anchor";
import { type Journey, journeyOf, sameJourney } from "../adapter-kit/journey";
import { MaplaceError } from "../errors";
import { type Route, sameStops } from "../route";
import type { Drawing } from "./drawing";
import type { GoogleMapState } from "./map-state";
import type { MapPart } from "./mounted-map";
import { type ComputedRoute, computeRoute } from "./route-compute";
import { routeFailed } from "./route-conversions";
import { drawRouteLine, type RouteLine } from "./route-line";

/** The adapter's route: a part on the open map, `setRoute`, and a `sync` after each `apply`. */
export interface Routing {
  readonly part: MapPart;
  setRoute(route: Route | undefined): void;
  /** Computes the route again if a stop moved. */
  sync(): void;
}

/**
 * Draws the store's route and reports it. Each computation is billed, so one is asked only for a
 * new journey (stops, `via`, travel mode, or where a stop is), at most once per task, and only once
 * every diff applied so far is drawn: never for a half-drawn map. The store doesn't send the
 * route again when a stop moves; a stop moves here only when the store writes it, which after a
 * drag is once, on release. A new style alone draws the line again without computing. An answer
 * for a journey since replaced, cleared or closed is dropped, its failure too. Each result and
 * failure names the route it was asked for.
 */
export function createRouting(
  state: GoogleMapState,
  drawing: Pick<Drawing, "applied" | "drawnThrough">,
): Routing {
  let route: Route | undefined;
  let asked: Journey | undefined;
  let line: RouteLine | undefined;
  let computing: Promise<void> = Promise.resolve();
  let scheduled: Promise<void> | undefined;

  function sync(): void {
    if (route === undefined) return;
    scheduled ??= Promise.resolve().then(computeIfNew);
    state.routeSettling = scheduled;
  }

  function computeIfNew(): Promise<void> {
    scheduled = undefined;
    if (route === undefined) return computing;
    const journey = journeyNow(route);
    if (journey === undefined) return computing;
    if (sameJourney(asked, journey)) line?.restyle(route.style);
    else computing = ask(journey, route);
    return computing;
  }

  /** The journey through the stops as drawn, once the map is open and every diff drawn. */
  function journeyNow(forRoute: Route): Journey | undefined {
    if (state.mounted === undefined || !drawing.drawnThrough(drawing.applied())) return undefined;
    return journeyOf(forRoute, (id) => {
      const geometry = state.placed.get(id)?.drawable().geometry;
      return geometry && anchorOf(geometry);
    });
  }

  /** Asks Google for `forRoute`; the answer counts only while this journey is still the one asked. */
  function ask(journey: Journey, forRoute: Route): Promise<void> {
    asked = journey;
    const isCurrent = () => asked === journey;
    return computeRoute(journey)
      .then((computed) => {
        if (isCurrent()) showResult(computed, forRoute);
      })
      .catch((error: unknown) => {
        if (isCurrent()) failRoute(error, forRoute);
      });
  }

  /** Draws the line in the style set now, and reports the result for the route asked. */
  function showResult({ google, result }: ComputedRoute, forRoute: Route): void {
    const mounted = state.mounted;
    if (mounted === undefined) return;
    removeLine();
    line = drawRouteLine(google, route?.style, mounted.map);
    mounted.live()?.reportRouteChange(forRoute, result);
  }

  /** The line goes; the journey stays asked, so it isn't billed again until it changes. */
  function failRoute(error: unknown, forRoute: Route): void {
    removeLine();
    const failure =
      error instanceof MaplaceError ? error : routeFailed("Google couldn't draw the route", error);
    state.mounted?.live()?.reportError(failure, forRoute);
  }

  /**
   * Whether `next` asks for the journey asked already (its stops, `via` and travel mode): if not,
   * an answer still to come is dropped even before the new stops are drawn.
   */
  function asksSameJourney(next: Route): boolean {
    return asked !== undefined && asked.travelMode === next.travelMode && sameStops(asked, next);
  }

  /** Nothing asked any more: answers still to come are dropped, and the line goes. */
  function forget(): void {
    asked = undefined;
    removeLine();
  }

  /** Lets go of the line before asking Google, which may have disabled the map (G9). */
  function removeLine(): void {
    const removing = line;
    line = undefined;
    removing?.remove();
  }

  return {
    part: {
      open({ onDestroy }) {
        onDestroy(forget);
        sync();
      },
    },
    setRoute(next) {
      route = next;
      if (next === undefined) {
        forget();
        return;
      }
      if (!asksSameJourney(next)) asked = undefined;
      sync();
    },
    sync,
  };
}
