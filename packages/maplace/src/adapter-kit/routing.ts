import type { AdapterHost } from "../adapter";
import type { Drawable } from "../drawable";
import { MaplaceError } from "../errors";
import { type Route, type RouteResult, sameComputation } from "../route";
import type { DiffQueue } from "./diff-queue";
import { anchorsOf, type Journey, journeyOf, sameJourney } from "./journey";
import { routeFailed } from "./route-result";

/** What a provider computed for a journey: at least the result the store is told. */
export interface ComputedRoute {
  readonly result: RouteResult;
}

/** How a route's line is drawn: its style, and how much is travelled, in its travelled style. */
export type RouteLook = Pick<Route, "style" | "progress" | "travelledStyle">;

/** A route's line on the map. */
export interface RouteLine {
  /** Draws the same route anew in `look`. */
  restyle(look: RouteLook): void;
  remove(): void;
}

/** What a provider routes with: how it computes a route and draws its line. */
export interface RoutingProvider<Computed extends ComputedRoute> {
  /** One computation; `signal` aborts once its answer would be dropped. */
  compute(journey: Journey, signal: AbortSignal): Promise<Computed>;
  /** The line for `computed` in `look`; undefined when the map has closed. */
  drawLine(computed: Computed, look: RouteLook): RouteLine | undefined;
  /** What failed when a failure isn't maplace's own, e.g. "Google couldn't draw the route". */
  readonly failure: string;
}

/** What the routing reads of an adapter's map state, and writes for its test probe. */
export interface RoutingState {
  readonly mounted: { live(): AdapterHost | undefined } | undefined;
  readonly placed: ReadonlyMap<string, { drawable(): Drawable }>;
  /** The computation scheduled last, which a test probe's `settle` waits on. */
  routeSettling: Promise<void> | undefined;
}

/** The adapter's route: a part on the open map, `setRoute`, and a `sync` after each `apply`. */
export interface Routing {
  readonly part: { open(mounted: { onDestroy(teardown: () => void): void }): void };
  setRoute(route: Route | undefined): void;
  /** Computes the route again if a stop moved; after each `apply`. */
  sync(): void;
}

/**
 * Draws the store's route and reports it. A computation may be billed, so one is asked only for
 * a new journey (stops, `via`, travel mode, `avoid`, or where a stop is), at most once per task,
 * and only once every diff applied so far is drawn: never for a half-drawn map. The store doesn't
 * send the route again when a stop moves; a stop moves only when the store writes it, which after
 * a drag is once, on release. A new look alone (style, progress, travelled style) draws the line
 * again without computing. An answer for a journey since replaced, cleared or closed is dropped,
 * its failure too, and its signal aborted. Each result and failure names the route it was asked
 * for.
 */
export function createRouting<Computed extends ComputedRoute>(
  state: RoutingState,
  drawing: Pick<DiffQueue, "applied" | "drawnThrough">,
  provider: RoutingProvider<Computed>,
): Routing {
  let route: Route | undefined;
  let asked: Journey | undefined;
  let asking: AbortController | undefined;
  let line: RouteLine | undefined;
  let drawnLook: RouteLook | undefined;
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
    if (!sameJourney(asked, journey)) computing = ask(journey, route);
    else if (drawnLook === undefined || !sameRouteLook(route, drawnLook)) {
      drawnLook = route;
      line?.restyle(drawnLook);
    }
    return computing;
  }

  /** The journey through the stops where they are, once the map is open and every diff drawn. */
  function journeyNow(forRoute: Route): Journey | undefined {
    if (state.mounted === undefined || !drawing.drawnThrough(drawing.applied())) return undefined;
    return journeyOf(forRoute, anchorsOf(state.placed));
  }

  /** Asks for `forRoute`; the answer counts only while this journey is still the one asked. */
  function ask(journey: Journey, forRoute: Route): Promise<void> {
    dropAsked();
    const controller = new AbortController();
    asked = journey;
    asking = controller;
    const isCurrent = () => asked === journey;
    return provider
      .compute(journey, controller.signal)
      .then((computed) => {
        if (isCurrent()) showResult(computed, forRoute);
      })
      .catch((error: unknown) => {
        if (isCurrent()) failRoute(error, forRoute);
      });
  }

  /** Draws the line in the look set now, and reports the result for the route asked. */
  function showResult(computed: Computed, forRoute: Route): void {
    removeLine();
    drawnLook = route ?? forRoute;
    line = provider.drawLine(computed, drawnLook);
    if (line !== undefined) state.mounted?.live()?.reportRouteChange(forRoute, computed.result);
  }

  /** The line goes; the journey stays asked, so it isn't computed again until it changes. */
  function failRoute(error: unknown, forRoute: Route): void {
    removeLine();
    const failure = error instanceof MaplaceError ? error : routeFailed(provider.failure, error);
    state.mounted?.live()?.reportError(failure, forRoute);
  }

  /** Nothing asked any more: an answer still to come is dropped, and its signal aborted. */
  function dropAsked(): void {
    asked = undefined;
    asking?.abort();
    asking = undefined;
  }

  /** Nothing asked any more, and the line goes. */
  function forget(): void {
    dropAsked();
    removeLine();
  }

  /**
   * Forgets the line, then takes it off the map: on a map its provider disabled taking it off may
   * throw, and the line is forgotten all the same.
   */
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
      // A route asking for another journey drops an answer still to come, even before its new
      // stops are drawn.
      if (asked !== undefined && !sameComputation(asked, next)) dropAsked();
      sync();
    },
    sync,
  };
}

/** Whether two looks draw alike: the same progress, and the same style objects (the store freezes a copy of each). */
function sameRouteLook(a: RouteLook, b: RouteLook): boolean {
  return a.style === b.style && a.progress === b.progress && a.travelledStyle === b.travelledStyle;
}
