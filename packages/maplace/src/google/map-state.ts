/// <reference types="google.maps" />

/** What the adapter has on the map, shared with its probe; each row adds what it draws. */
export interface GoogleMapState {
  map: google.maps.Map | undefined;
}

export function createMapState(): GoogleMapState {
  return { map: undefined };
}
