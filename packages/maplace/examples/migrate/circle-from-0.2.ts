// Converting a 0.2 circle: its point is `center`, and `radius` is a field.
import type { CircleLocation } from "maplace";
import { type Legacy, toLocation } from "./from-0.2";

interface LegacyCircle extends Legacy {
  readonly circle_options?: { readonly radius?: number };
}

export function toCircle(legacy: LegacyCircle, index: number): CircleLocation {
  const { id, lat, lng, title, html, zoom, listed } = toLocation(legacy, index);
  // 0.2's default `circle_options` beat a plain `radius`.
  const radius = legacy.circle_options?.radius ?? 100;
  return { type: "circle", id, center: { lat, lng }, radius, title, html, zoom, listed };
}
