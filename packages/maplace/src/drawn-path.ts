import type { LatLng } from "./geometry";
import { greatCircleSegment, type SegmentPath } from "./great-circle";
import type { PolylineLocation } from "./location";
import { wrapLongitude } from "./longitude-arc";

type Path = readonly LatLng[];

/** Points drawn along each bowed segment: smooth even across the whole world. */
export const SAMPLES_PER_SEGMENT = 64;

/** Each path's last drawing and its kind; a path drawn another way is drawn again. */
const drawnByPath = new WeakMap<
  Path,
  { readonly kind: "geodesic" | number; readonly drawn: Path }
>();

/**
 * The path a line is drawn along: its `path`, each segment along its great circle when it is
 * `geodesic`, else bowed by `curve` when it has one (a polygon or a geometry has neither). The
 * same path and drawing give the same frozen array, so an unchanged line keeps its geometry.
 */
export function drawnPath({
  path,
  curve,
  geodesic,
}: Pick<PolylineLocation, "path" | "curve" | "geodesic">): Path {
  const kind = geodesic ? "geodesic" : curve;
  if (!kind || path.length < 2) return path;
  const last = drawnByPath.get(path);
  if (last?.kind === kind) return last.drawn;
  const drawn = Object.freeze(
    sampled(path, (from, to) =>
      kind === "geodesic"
        ? // No single great circle joins the same or opposite points: straight, a bow of 0.
          (greatCircleSegment(from, to) ?? bowedSegment(from, to, 0))
        : bowedSegment(from, to, kind),
    ),
  );
  drawnByPath.set(path, { kind, drawn });
  return drawn;
}

/** Each segment sampled along its own path, then the last point. */
function sampled(path: Path, segmentPath: (from: LatLng, to: LatLng) => SegmentPath): LatLng[] {
  const drawn: LatLng[] = [];
  for (let index = 1; index < path.length; index++) {
    const { steps, at } = segmentPath(path[index - 1] as LatLng, path[index] as LatLng);
    for (let step = 0; step < steps; step++) drawn.push(samplePoint(at(step / steps)));
  }
  drawn.push(samplePoint(path.at(-1) as LatLng));
  return drawn;
}

/**
 * A quadratic Bézier in degrees, unscaled: its control point is the midpoint pushed `curve` × the
 * segment's length to the left of travel. The next point's longitude is unwrapped first, so a
 * segment crosses ±180 the short way.
 */
function bowedSegment(from: LatLng, to: LatLng, curve: number): SegmentPath {
  const dLat = to.lat - from.lat;
  const dLng = wrapLongitude(to.lng - from.lng);
  const at = (t: number): LatLng => {
    const bow = 2 * t * (1 - t) * curve;
    return { lat: from.lat + t * dLat + bow * dLng, lng: from.lng + t * dLng - bow * dLat };
  };
  return { steps: SAMPLES_PER_SEGMENT, at };
}

/** A frozen point, its latitude within ±90 and its longitude in -180..180. */
function samplePoint({ lat, lng }: LatLng): LatLng {
  return Object.freeze({ lat: Math.min(90, Math.max(-90, lat)), lng: wrapLongitude(lng) });
}
