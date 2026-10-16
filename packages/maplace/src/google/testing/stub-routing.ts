import type { Drawable } from "../../drawable";
import { markerDrawable } from "../../testing/conformance/fixtures";
import { createMapState } from "../map-state";
import type { PlacedLocation } from "../placed-location";
import { createRouting } from "../routing";
import { wait } from "./map-waits";
import { stubDrawingProgress } from "./stub-drawing";
import { routesOnPage, StubRoute } from "./stub-routes";
import type { StubPolyline } from "./stub-shapes";
import { stubMounted } from "./stub-site";

/** A route through the two stops placed. */
export const AB = { stops: ["a", "b"] } as const;

/** Lets the scheduled computation start and the routes library load. */
export const tick = () => wait(0);

/**
 * Routing on a stub map, before it opens, with stops `a` and `b` placed and every diff drawn;
 * `place` and `move` put a location on the map as a drawn diff would, `answer` gives Google's
 * answer, and `routed`
 * opens the map with the route through `a` and `b` asked.
 */
export function routingOnStubs() {
  const routes = routesOnPage();
  const state = createMapState();
  const opened = stubMounted(state);
  state.mounted = undefined;
  const { counts: drawing, progress } = stubDrawingProgress();
  const routing = createRouting(state, progress);
  const place = (drawable: Drawable) => {
    state.placed.set(drawable.id, { drawable: () => drawable } as unknown as PlacedLocation);
  };
  const move = (id: string, lat: number, lng = 11) => place(markerDrawable(id, { lat, lng }));
  move("a", 44);
  move("b", 45);
  const open = () => {
    state.mounted = opened.mounted;
    routing.part.open(opened.mounted);
  };
  return {
    ...opened,
    state,
    routes,
    drawing,
    routing,
    place,
    move,
    open,
    async routed() {
      open();
      routing.setRoute(AB);
      await tick();
    },
    /** Answers the oldest request with `route` (one 1 km leg), then lets it show. */
    async answer(route = new StubRoute()) {
      routes.answer(route);
      await state.routeSettling;
      return route;
    },
    /** Moves stop `b` and syncs, as the diff that moves it would. */
    async moveStopB() {
      move("b", 45.5);
      routing.sync();
      await tick();
    },
    reported: () => opened.host.reportsOf("reportRoute").map(([result]) => result),
    errors: () => opened.host.reportsOf("reportError").map(([error]) => error),
  };
}

/** The line drawn last from `route`. */
export function lineOf(route: StubRoute): StubPolyline {
  const drawn = route.createPolylines.mock.results;
  return drawn.at(-1)?.value[0] as StubPolyline;
}
