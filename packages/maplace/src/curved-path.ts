import type { LatLng } from "./geometry";
import type { PolylineLocation } from "./location";
import { wrapLongitude } from "./longitude-arc";

type Path = readonly LatLng[];

/** Points drawn along each bowed segment: smooth even across the whole world. */
export const SAMPLES_PER_SEGMENT = 64;

/** Each path's last drawing; one path shared by lines of different curves is drawn again. */
const drawnByPath = new WeakMap<Path, { readonly curve: number; readonly drawn: Path }>();

/**
 * The path a line is drawn along: its `path`, each segment bowed by `curve` when it has one (a
 * polygon or a geometry has none). The same path and curve give the same frozen array, so an
 * unchanged line keeps its geometry.
 */
export function drawnPath({ path, curve }: Pick<PolylineLocation, "path" | "curve">): Path {
  if (!curve || path.length < 2) return path;
  const last = drawnByPath.get(path);
  if (last?.curve === curve) return last.drawn;
  const drawn = Object.freeze(bowed(path, curve));
  drawnByPath.set(path, { curve, drawn });
  return drawn;
}

/**
 * Each segment as a quadratic Bézier in degrees, unscaled: its control point is the midpoint
 * pushed `curve` × the segment's length to the left of travel. The next point's longitude is
 * unwrapped first, so a segment crosses ±180 the short way.
 */
function bowed(path: Path, curve: number): LatLng[] {
  const drawn: LatLng[] = [];
  for (let index = 1; index < path.length; index++) {
    const from = path[index - 1] as LatLng;
    const to = path[index] as LatLng;
    const dLat = to.lat - from.lat;
    const dLng = wrapLongitude(to.lng - from.lng);
    for (let step = 0; step < SAMPLES_PER_SEGMENT; step++) {
      const t = step / SAMPLES_PER_SEGMENT;
      const bow = 2 * t * (1 - t) * curve;
      drawn.push(samplePoint(from.lat + t * dLat + bow * dLng, from.lng + t * dLng - bow * dLat));
    }
  }
  const last = path.at(-1) as LatLng;
  drawn.push(samplePoint(last.lat, last.lng));
  return drawn;
}

/** A frozen point, its latitude within ±90 and its longitude in -180..180. */
function samplePoint(lat: number, lng: number): LatLng {
  return Object.freeze({ lat: Math.min(90, Math.max(-90, lat)), lng: wrapLongitude(lng) });
}
