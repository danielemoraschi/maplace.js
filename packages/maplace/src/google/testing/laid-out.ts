import type { Box } from "../../adapter-kit/popup-shift";

/** A box on the page: left, top, width, height. */
export type LaidOutBox = readonly [left: number, top: number, width: number, height: number];

/** Gives `element` `box` as its `getBoundingClientRect`, as layout would: happy-dom has none. */
export function laidOutAt(element: Element, box: LaidOutBox): void {
  const [left, top, width, height] = box;
  const rect = { ...boxAt(box), width, height, x: left, y: top };
  element.getBoundingClientRect = () => ({ ...rect, toJSON: () => rect }) as DOMRect;
}

/** `box`'s edges, as `getBoundingClientRect` gives them. */
export function boxAt([left, top, width, height]: LaidOutBox): Box {
  return { left, top, right: left + width, bottom: top + height };
}
