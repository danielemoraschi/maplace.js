import type { MapSize } from "./web-mercator";

/** The size a map is drawn at: its element's. */
export function sizeOf(element: HTMLElement): MapSize {
  return { width: element.clientWidth, height: element.clientHeight };
}

/** Whether a map shows anything: a closed tab or dialog leaves it no size (RFC). */
export function hasSize({ width, height }: MapSize): boolean {
  return width > 0 && height > 0;
}

export function sameSize(a: MapSize, b: MapSize): boolean {
  return a.width === b.width && a.height === b.height;
}
