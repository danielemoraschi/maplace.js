// @vitest-environment happy-dom
import type { Marker } from "maplibre-gl";
import { afterEach, describe, expect, it } from "vitest";
import { endDragReleasedOutside } from "./drag-release";
import type { MountedMapLibre } from "./mounted-map";

/** MapLibre's map event, as the release is fired: its type and the DOM event under it. */
class RecordedMouseEvent {
  constructor(
    readonly type: string,
    _map: unknown,
    readonly originalEvent: MouseEvent,
  ) {}
}

afterEach(() => {
  document.body.replaceChildren();
});

/** A marker in a map's canvas container on the page, beside an element outside the map. */
function releasing({ draggable = true } = {}) {
  const container = document.createElement("div");
  const canvasContainer = document.createElement("div");
  const element = document.createElement("div");
  const outside = document.createElement("div");
  canvasContainer.append(element);
  container.append(canvasContainer);
  document.body.append(container, outside);
  const fired: RecordedMouseEvent[] = [];
  const map = {
    getContainer: () => container,
    getCanvasContainer: () => canvasContainer,
    fire: (event: RecordedMouseEvent) => fired.push(event),
  };
  const marker = { getElement: () => element, isDraggable: () => draggable };
  const closing = new AbortController();
  const mounted = {
    map,
    maplibre: { MapMouseEvent: RecordedMouseEvent },
    closing: closing.signal,
  } as unknown as MountedMapLibre;
  endDragReleasedOutside(marker as unknown as Marker, mounted);
  const press = () => element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  const release = (on: Element) => on.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  return { element, canvasContainer, outside, fired, closing, press, release };
}

describe("a marker's drag let go outside the map", () => {
  it("fires the map's mouseup for a press on a draggable marker let go outside the map's canvas", () => {
    const { outside, fired, press, release } = releasing();
    press();
    release(outside);
    expect(fired.map(({ type }) => type)).toEqual(["mouseup"]);
    expect(fired[0]?.originalEvent.target).toBe(outside);
  });

  it("leaves a release over the map's canvas to MapLibre", () => {
    const { canvasContainer, fired, press, release } = releasing();
    press();
    release(canvasContainer);
    expect(fired).toEqual([]);
  });

  it("does nothing for a press on a marker that can't be dragged", () => {
    const { outside, fired, press, release } = releasing({ draggable: false });
    press();
    release(outside);
    expect(fired).toEqual([]);
  });

  it("ends nothing for a marker taken off the map before the release", () => {
    const { element, outside, fired, press, release } = releasing();
    press();
    element.remove();
    release(outside);
    expect(fired).toEqual([]);
  });

  it("hears one release per press", () => {
    const { outside, fired, press, release } = releasing();
    press();
    release(outside);
    release(outside);
    expect(fired).toHaveLength(1);
  });

  it("hears a release outside whose propagation a page stopped", () => {
    const { outside, fired, press, release } = releasing();
    outside.addEventListener("mouseup", (event) => event.stopPropagation());
    press();
    release(outside);
    expect(fired).toHaveLength(1);
  });

  it("stops listening once the map closes", () => {
    const { outside, fired, closing, press, release } = releasing();
    press();
    closing.abort();
    release(outside);
    expect(fired).toEqual([]);
  });
});
