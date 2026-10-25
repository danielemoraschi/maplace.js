// @vitest-environment happy-dom
import type { Marker } from "maplibre-gl";
import { afterEach, describe, expect, it } from "vitest";
import { endDragsTheMapMisses } from "./drag-release";
import type { MountedMapLibre } from "./mounted-map";

/** MapLibre's map event, as the release is fired: its type and the DOM event under it. */
class RecordedMapEvent {
  constructor(
    readonly type: string,
    _map: unknown,
    readonly originalEvent: Event,
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
  const fired: RecordedMapEvent[] = [];
  const map = {
    getContainer: () => container,
    getCanvasContainer: () => canvasContainer,
    fire: (event: RecordedMapEvent) => fired.push(event),
  };
  const marker = { getElement: () => element, isDraggable: () => draggable };
  const closing = new AbortController();
  const mounted = {
    map,
    maplibre: { MapMouseEvent: RecordedMapEvent, MapTouchEvent: RecordedMapEvent },
    closing: closing.signal,
  } as unknown as MountedMapLibre;
  const held = endDragsTheMapMisses(marker as unknown as Marker, mounted);
  const press = () => element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  const release = (on: Element) => on.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  /** A touch event on `on`, the marker unless given, where every event of a touch goes; returned. */
  const touch = (type: string, on: Node = element) => {
    const event = new TouchEvent(type, { bubbles: true });
    on.dispatchEvent(event);
    return event;
  };
  return { element, canvasContainer, outside, fired, closing, held, press, release, touch };
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

describe("a marker's drag held when the window loses focus", () => {
  const loseFocus = () => window.dispatchEvent(new Event("blur"));

  it("fires the map's mouseup where the pointer last was when the window loses focus during a press", () => {
    const { fired, press } = releasing();
    press();
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 40, clientY: 50 }));
    loseFocus();
    expect(fired.map(({ type }) => type)).toEqual(["mouseup"]);
    const release = fired[0]?.originalEvent as MouseEvent;
    expect([release.type, release.clientX, release.clientY]).toEqual(["mouseup", 40, 50]);
    expect(release.target).toBeNull();
  });

  it("ends nothing on a blur after the press was let go", () => {
    const { canvasContainer, fired, press, release } = releasing();
    press();
    release(canvasContainer);
    loseFocus();
    expect(fired).toEqual([]);
  });

  it("hears no element's blur as the window's", () => {
    const { element, fired, press } = releasing();
    press();
    element.dispatchEvent(new FocusEvent("blur"));
    expect(fired).toEqual([]);
  });
});

describe("the press held on a marker", () => {
  it("holds a press until it is let go over the canvas", () => {
    const { canvasContainer, held, press, release } = releasing();
    press();
    expect(held.isHeld()).toBe(true);
    release(canvasContainer);
    expect(held.isHeld()).toBe(false);
  });

  it("ends the listeners of a press when the next one begins", () => {
    const { outside, fired, press, release } = releasing();
    press();
    press();
    release(outside);
    expect(fired).toHaveLength(1);
  });

  it("holds no press on a marker that can't be dragged", () => {
    const { held, press } = releasing({ draggable: false });
    press();
    expect(held.isHeld()).toBe(false);
  });

  it("releases the press held when asked, once", () => {
    const { fired, held, press } = releasing();
    press();
    held.release();
    expect(fired.map(({ type }) => type)).toEqual(["mouseup"]);
    expect(held.isHeld()).toBe(false);
    held.release();
    expect(fired).toHaveLength(1);
  });
});

describe("a marker's touch drag", () => {
  it("fires the map's touchend for a touch on a draggable marker the browser cancels, with the cancel's touches", () => {
    const { fired, touch } = releasing();
    touch("touchstart");
    const cancel = touch("touchcancel");
    expect(fired.map(({ type }) => type)).toEqual(["touchend"]);
    expect(fired[0]?.originalEvent).toBe(cancel);
  });

  it("leaves a touch's own moves and end to MapLibre", () => {
    const { fired, touch } = releasing();
    touch("touchstart");
    touch("touchmove");
    touch("touchend");
    touch("touchcancel");
    expect(fired).toEqual([]);
  });

  it("holds no touch on a marker that can't be dragged", () => {
    const { fired, held, touch } = releasing({ draggable: false });
    touch("touchstart");
    touch("touchcancel");
    expect(held.isHeld()).toBe(false);
    expect(fired).toEqual([]);
  });

  it("releases a touch press held when asked, as the map's touchend", () => {
    const { fired, held, touch } = releasing();
    const start = touch("touchstart");
    held.release();
    expect(fired.map(({ type }) => type)).toEqual(["touchend"]);
    expect(fired[0]?.originalEvent).toBe(start);
    expect(held.isHeld()).toBe(false);
    touch("touchcancel");
    expect(fired).toHaveLength(1);
  });

  it("fires the moves and the end of a touch whose node the page took out of the marker", () => {
    const { element, fired, touch } = releasing();
    const icon = element.appendChild(document.createElement("span"));
    touch("touchstart", icon);
    icon.remove();
    const move = touch("touchmove", icon);
    const end = touch("touchend", icon);
    expect(fired.map(({ type, originalEvent }) => [type, originalEvent])).toEqual([
      ["touchmove", move],
      ["touchend", end],
    ]);
  });

  it("fires nothing for a touch cut off from a marker taken off the map", () => {
    const { element, fired, touch } = releasing();
    const icon = element.appendChild(document.createElement("span"));
    touch("touchstart", icon);
    icon.remove();
    element.remove();
    touch("touchmove", icon);
    touch("touchend", icon);
    expect(fired).toEqual([]);
  });
});
