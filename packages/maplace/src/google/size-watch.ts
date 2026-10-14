import { sameSize, sizeOf } from "../adapter-kit/map-size";
import type { MapSize } from "../adapter-kit/web-mercator";

/**
 * Calls `onResize` each time the element's size changes, until the returned function stops it.
 * An observer always calls back once when it starts: that is where the map starts, not a change,
 * and treating it as one would show the view again and report it twice.
 */
export function watchSize(element: HTMLElement, onResize: (size: MapSize) => void): () => void {
  let last: MapSize | undefined;
  const observer = new ResizeObserver(() => {
    const size = sizeOf(element);
    const changed = last !== undefined && !sameSize(last, size);
    last = size;
    if (changed) onResize(size);
  });
  observer.observe(element);
  return () => observer.disconnect();
}
