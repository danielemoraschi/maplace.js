import type { MapMouseEvent } from "maplibre-gl";
import type { MountedMapLibre } from "./mounted-map";
import { isInCanvasContainer } from "./pointer-targets";

/** The pointer read again where it last was on the page, and the topmost element there now. */
export interface PointerNow {
  readonly event: MapMouseEvent;
  readonly target: Element | null;
}

/** Where the pointer is on the map while it hasn't moved since. */
export interface StillPointer {
  /** The pointer moved on the map: it is there until it moves again. */
  remember(event: MapMouseEvent): void;
  /** The pointer left the map, or its place is no longer known. */
  forget(): void;
  /** Where it is now; none when unknown, or the map is off the page. */
  now(): PointerNow | undefined;
}

/**
 * The pointer's last place on the map, read again on the page when asked, as the map or something
 * over it may have moved there since. A press forgets it: a pan fires no map `mousemove` (MapLibre
 * blocks map events while it pans), so the place would be stale by the pan's delta, until the
 * release, which MapLibre always fires, says where the pointer is.
 */
export function stillPointer({ map, maplibre, onDestroy }: MountedMapLibre): StillPointer {
  let last: MapMouseEvent | undefined;
  const remember = (event: MapMouseEvent) => {
    last = event;
  };
  const forget = () => {
    last = undefined;
  };
  // drag-release fires the releases the map missed (let go outside it, a window blur, a drag the
  // page cut short) as the map's own, dispatched outside the canvas container or nowhere: no place
  // on it. A page's code may fire one with no pointer event under it.
  const rememberRelease = (event: MapMouseEvent) => {
    const { originalEvent } = event;
    if (originalEvent !== undefined && isInCanvasContainer(originalEvent, map)) remember(event);
  };
  map.on("mousedown", forget);
  map.on("touchstart", forget);
  map.on("mouseup", rememberRelease);
  onDestroy(() => {
    map.off("mousedown", forget);
    map.off("touchstart", forget);
    map.off("mouseup", rememberRelease);
  });
  return {
    remember,
    forget,
    now() {
      const canvas = map.getCanvas();
      const root = canvas.getRootNode();
      if (last?.originalEvent === undefined || !hasElementsAt(root)) return undefined;
      const { type, originalEvent } = last;
      const target = root.elementFromPoint(originalEvent.clientX, originalEvent.clientY);
      return { event: new maplibre.MapMouseEvent(type, map, originalEvent), target };
    },
  };
}

/**
 * A page or a shadow root, which finds the element at a point; a tree off the page is neither.
 * Asked by the method, as a map in another window's page is of another realm.
 */
function hasElementsAt(root: Node): root is Document | ShadowRoot {
  return "elementFromPoint" in root;
}
