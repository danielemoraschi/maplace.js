import type { LatLng } from "./geometry";
import type { LineStyle } from "./style";

export type TravelMode = "driving" | "walking" | "bicycling" | "transit";

/** One route through your own locations, in order. Needs the `route` capability. */
export interface Route {
  /** Location ids, at least 2; the adapter sets the maximum (`Adapter.routeStopLimit`). */
  readonly stops: readonly string[];
  readonly travelMode?: TravelMode | undefined;
  readonly style?: LineStyle | undefined;
}

export interface RouteLeg {
  readonly from: string;
  readonly to: string;
  readonly distanceMeters: number;
  readonly durationSeconds: number;
}

/** A computed route, in neutral units; never a provider object. */
export interface RouteResult {
  readonly legs: readonly RouteLeg[];
  readonly distanceMeters: number;
  readonly durationSeconds: number;
  readonly path: readonly LatLng[];
}
