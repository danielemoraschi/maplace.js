/// <reference types="google.maps" />

/** Google's next `idle` on `map`. */
export function idle(map: google.maps.Map): Promise<void> {
  return new Promise((resolve) => google.maps.event.addListenerOnce(map, "idle", () => resolve()));
}

/** `count` frames drawn. */
export async function frames(count: number): Promise<void> {
  for (let frame = 0; frame < count; frame++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}
