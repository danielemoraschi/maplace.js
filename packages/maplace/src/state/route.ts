import { sameJourney, sameRoute } from "../diff/same";
import { locationById } from "../location-state";
import { innerStops, type Route } from "../route";
import type { Snapshot } from "../store";
import { child, describeValue, type Field, item, reject, root } from "../validate/fail";
import { checkRoute } from "../validate/route";
import { andThen, type Change, NO_CHANGE, patchOnly } from "./change";
import { checkKnownId } from "./checks";

const MIN_STOPS = 2;

/**
 * Sets or clears the route. An equal route changes nothing; new stops, `via` or travel mode clear
 * the old result, while a new style alone keeps it (the line is redrawn, not recomputed).
 */
export function setRoute<Data>(snapshot: Snapshot<Data>, route: Route | undefined): Change<Data> {
  if (route === undefined) return snapshot.route === undefined ? NO_CHANGE : clearRoute(snapshot);
  checkRoute(route, routeField());
  checkStops(snapshot, route.stops);
  checkVia(route);
  const current = snapshot.route;
  if (current !== undefined && sameRoute(current, route)) return NO_CHANGE;
  const replaced = patchOnly<Data>({ route: frozenCopy(route) });
  const recompute = current === undefined || !sameJourney(current, route);
  return recompute ? andThen(snapshot, replaced, clearResult) : replaced;
}

/**
 * Drops stops whose location is gone, and `via` ids no longer among the inner stops; below two
 * stops the route clears.
 */
export function pruneRoute<Data>(snapshot: Snapshot<Data>): Change<Data> {
  const { route } = snapshot;
  if (route === undefined) return NO_CHANGE;
  const stops = route.stops.filter((id) => locationById(snapshot.locations, id) !== undefined);
  if (stops.length === route.stops.length) return NO_CHANGE;
  if (stops.length < MIN_STOPS) return clearRoute(snapshot);
  const via = route.via && { via: prunedVia(route.via, stops) };
  const pruned = patchOnly<Data>({ route: frozenCopy({ ...route, stops, ...via }) });
  return andThen(snapshot, pruned, clearResult);
}

/** Every stop must exist, checked before their count (RFC §3). */
function checkStops(snapshot: Snapshot<unknown>, stops: readonly string[]): void {
  for (const [index, id] of stops.entries()) {
    checkKnownId(snapshot.locations, id, item(child(routeField(id), "stops"), index));
  }
  if (stops.length < MIN_STOPS) {
    reject(
      child(routeField(), "stops"),
      `must name at least ${MIN_STOPS} locations, got ${stops.length}`,
    );
  }
}

/** Each `via` id is an inner stop, checked once the stops are known. */
function checkVia({ stops, via = [] }: Route): void {
  const inner = innerStops(stops);
  for (const [index, id] of via.entries()) {
    if (!inner.includes(id)) {
      reject(
        item(child(routeField(id), "via"), index),
        `must name a stop between the first and the last, got ${describeValue(id)}`,
      );
    }
  }
}

function prunedVia(via: readonly string[], stops: readonly string[]): readonly string[] {
  const inner = innerStops(stops);
  return via.filter((id) => inner.includes(id));
}

function clearRoute<Data>(snapshot: Snapshot<Data>): Change<Data> {
  return andThen(snapshot, patchOnly({ route: undefined }), clearResult);
}

function clearResult<Data>(snapshot: Snapshot<Data>): Change<Data> {
  const events: Change<Data>["events"] =
    snapshot.routeResult === undefined
      ? []
      : [{ name: "routeChange", payload: { result: undefined } }];
  return { patch: { routeResult: undefined }, events };
}

function frozenCopy(route: Route): Route {
  const style = route.style && Object.freeze({ ...route.style });
  const via = route.via && Object.freeze([...route.via]);
  return Object.freeze({
    ...route,
    stops: Object.freeze([...route.stops]),
    ...(via && { via }),
    ...(style && { style }),
  });
}

function routeField(locationId?: string): Field {
  return child(root("setRoute", locationId), "route");
}
