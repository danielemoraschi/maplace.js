/// <reference types="google.maps" />

/** Google's next `idle` on `map`. */
export function idle(map: google.maps.Map): Promise<void> {
  return new Promise((resolve) => google.maps.event.addListenerOnce(map, "idle", () => resolve()));
}
