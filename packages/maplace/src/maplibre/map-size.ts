import type { Map as MapLibreMap } from "maplibre-gl";
import { hasSize, sizeOf } from "../adapter-kit/map-size";
import type { MapSize } from "../adapter-kit/web-mercator";

/**
 * Whether MapLibre has taken in its container's size: its canvas is laid out at the container's
 * size, but for MapLibre's rounding to whole device pixels, at most half of one at the pixel ratio
 * it applied. It takes a new size in only after its throttled resize observer, and draws a
 * container with no size at 400 by 300.
 */
export function sizeTakenIn(map: MapLibreMap): boolean {
  const container = sizeOf(map.getContainer());
  const canvas = map.getCanvas();
  const width = Number.parseFloat(canvas.style.width);
  const height = Number.parseFloat(canvas.style.height);
  if (!(width > 0 && height > 0)) return false;
  // Half a device pixel exactly, when the size ends in one, plus what floating point loses on it.
  const slack = 0.5 / Math.min(canvas.width / width, 1) + 0.01;
  const near = (a: number, b: number) => Math.abs(a - b) <= slack;
  return near(container.width, width) && near(container.height, height);
}

/** The map's size, once MapLibre has taken it in; undefined while its container has none. */
export function mapSizeOf(map: MapLibreMap): MapSize | undefined {
  const size = sizeOf(map.getContainer());
  return hasSize(size) && sizeTakenIn(map) ? size : undefined;
}

export const hasMapSize = (map: MapLibreMap) => mapSizeOf(map) !== undefined;
