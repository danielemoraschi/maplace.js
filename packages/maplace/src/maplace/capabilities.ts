import type { Adapter, Capability } from "../adapter";
import type { Location } from "../location";
import type { Route } from "../route";
import type { Snapshot } from "../store";
import { child, type Field, reject, root } from "../validate/fail";
import { locationRoot } from "../validate/location";

/** What one adapter can draw. */
export type AdapterLimits = Pick<Adapter, "capabilities" | "routeStopLimit">;

/** Throws when `snapshot` needs what the adapter lacks; `method` labels the error. */
export type SupportCheck = (snapshot: Snapshot, method: string) => void;

/**
 * Checks snapshots against one adapter. Each part is checked when it changes, not on every
 * call, so a `select` among many locations costs nothing here.
 */
export function createSupportCheck(limits: AdapterLimits): SupportCheck {
  let checked: Pick<Snapshot, "locations" | "route"> | undefined;
  return (snapshot, method) => {
    if (snapshot.locations !== checked?.locations) checkLocations(snapshot.locations, limits);
    if (snapshot.route !== checked?.route && snapshot.route !== undefined) {
      checkRoute(snapshot.route, limits, child(root(method), "route"));
    }
    checked = snapshot;
  };
}

/** `cluster` is fixed for the life of a store, so `attach` checks it once, when it is on. */
export function checkCluster(limits: AdapterLimits, field: Field): void {
  if (!limits.capabilities.has("cluster")) unsupported(field, "cluster");
}

function checkLocations(locations: readonly Location[], limits: AdapterLimits): void {
  const needsCircle = !limits.capabilities.has("circle");
  const needsEdit = !limits.capabilities.has("edit");
  if (!needsCircle && !needsEdit) return;
  for (const location of locations) {
    if (needsCircle && location.type === "circle") {
      unsupported(child(locationRoot(location.id), "type"), "circle");
    }
    if (needsEdit && location.editable === true) {
      unsupported(child(locationRoot(location.id), "editable"), "edit");
    }
  }
}

function checkRoute(route: Route, limits: AdapterLimits, field: Field): void {
  if (!limits.capabilities.has("route")) unsupported(field, "route");
  const limit = limits.routeStopLimit;
  if (limit !== undefined && route.stops.length > limit) {
    reject(
      child(field, "stops"),
      `must name at most ${limit} locations, got ${route.stops.length}`,
    );
  }
}

function unsupported(field: Field, capability: Capability): never {
  const problem = `needs the ${capability} capability, which this map's adapter lacks`;
  return reject(field, problem, "unsupported-capability");
}
