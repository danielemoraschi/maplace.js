import type { RouteRequest } from "@maplacejs/maplace";

/** The stored route's stops, Milan to Munich through Zurich and Paris: as the route example asks. */
export const STORED_ROUTE_STOPS: RouteRequest["stops"] = [
  { id: "milan", lat: 45.4642, lng: 9.19, via: false },
  { id: "zurich", lat: 47.3769, lng: 8.5417, via: true },
  { id: "paris", lat: 48.8566, lng: 2.3522, via: false },
  { id: "munich", lat: 48.1351, lng: 11.582, via: false },
];
