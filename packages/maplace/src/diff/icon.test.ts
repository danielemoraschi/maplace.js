// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import type { Location, LocationState, MarkerLocation } from "../location";
import { iconRenderer, sameIconSource } from "./icon";

const at = { lat: 0, lng: 0 };
const IDLE: LocationState = { selected: false, hovered: false };
const SELECTED: LocationState = { selected: true, hovered: false };
const NO_REPORT = () => {};

function render(location: Location, state = IDLE): Node {
  const node = iconRenderer(location, { report: NO_REPORT })?.(state);
  if (node === undefined) throw new Error("expected an icon");
  return node;
}

describe("iconRenderer", () => {
  it("is undefined without an icon, and for shapes", () => {
    expect(iconRenderer({ id: "a", ...at }, { report: NO_REPORT })).toBeUndefined();
    expect(
      iconRenderer({ id: "c", type: "circle", center: at, radius: 1 }, { report: NO_REPORT }),
    ).toBeUndefined();
  });

  it("turns a URL into an image whose name comes from the title, not alt text", () => {
    const image = render({ id: "a", ...at, icon: "/pin.svg" }) as HTMLImageElement;
    expect(image.tagName).toBe("IMG");
    expect(image.getAttribute("src")).toBe("/pin.svg");
    expect(image.alt).toBe("");
  });

  it("returns a Node as the same node", () => {
    const node = document.createElement("span");
    expect(render({ id: "a", ...at, icon: node })).toBe(node);
  });

  it("calls a function with the location and the state", () => {
    const icon = vi.fn(() => document.createElement("span"));
    const location: MarkerLocation = { id: "a", ...at, icon };
    render(location, SELECTED);
    expect(icon).toHaveBeenCalledWith(location, SELECTED);
  });

  it("stamps the state on the marker it builds", () => {
    const element = render({ id: "a", ...at, icon: "/pin.svg" }, SELECTED) as Element;
    expect(element.hasAttribute("data-selected")).toBe(true);
    expect(element.hasAttribute("data-hovered")).toBe(false);
  });
});

describe("the store's markerIcon", () => {
  const pin = document.createElement("span");
  const withPin = { report: NO_REPORT, markerIcon: pin };

  it("marks a marker without an icon, a location's own winning", () => {
    expect(iconRenderer({ id: "a", ...at }, withPin)?.(IDLE)?.nodeName).toBe("SPAN");
    const own = iconRenderer({ id: "b", ...at, icon: "/own.svg" }, withPin)?.(IDLE);
    expect(own?.nodeName).toBe("IMG");
  });

  it.each<Location>([
    { id: "c", type: "circle", center: at, radius: 1 },
    { id: "l", type: "polyline", path: [at, { lat: 1, lng: 1 }] },
    { id: "p", type: "polygon", path: [at, { lat: 1, lng: 1 }, { lat: 1, lng: 0 }] },
  ])("marks no $type", (shape) => {
    expect(iconRenderer(shape, withPin)).toBeUndefined();
  });

  it("keeps one copy of a markerIcon node per marker across states, a different copy per marker", () => {
    const forA = iconRenderer({ id: "a", ...at }, withPin);
    const forB = iconRenderer({ id: "b", ...at }, withPin);
    const copy = forA?.(IDLE);
    expect(forA?.(SELECTED)).toBe(copy);
    expect(copy).not.toBe(pin);
    expect(forB?.(IDLE)).not.toBe(copy);
    expect(pin.parentNode).toBeNull();
  });

  it("builds a URL as an image and calls a function with the location and its state", () => {
    const image = iconRenderer({ id: "a", ...at }, { report: NO_REPORT, markerIcon: "/pin.svg" });
    expect((image?.(IDLE) as Element | undefined)?.getAttribute("src")).toBe("/pin.svg");
    const build = vi.fn(() => document.createElement("b"));
    const location: MarkerLocation = { id: "a", ...at };
    iconRenderer(location, { report: NO_REPORT, markerIcon: build })?.(SELECTED);
    expect(build).toHaveBeenCalledWith(location, SELECTED);
  });

  it("reports a markerIcon function that throws under its own field", () => {
    const report = vi.fn();
    const failing = () => {
      throw new Error("no pin");
    };
    iconRenderer({ id: "a", ...at }, { report, markerIcon: failing })?.(IDLE);
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({ locationId: "a", field: "markerIcon" }),
    );
  });
});

describe("an icon function that fails", () => {
  it("draws nothing for that state and reports the page's bug once", () => {
    const report = vi.fn();
    const renderIcon = iconRenderer(
      {
        id: "a",
        ...at,
        icon: () => {
          throw new Error("page bug");
        },
      },
      { report },
    );
    expect(renderIcon?.(IDLE)).toBeUndefined();
    expect(renderIcon?.(SELECTED)).toBeUndefined();
    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({ code: "invalid-input", locationId: "a", field: "icon" }),
    );
  });
});

describe("the state on a marker", () => {
  it("follows each render: attributes of the current states set, the others removed", () => {
    const renderIcon = iconRenderer(
      { id: "a", ...at, icon: document.createElement("span") },
      { report: NO_REPORT },
    );
    const element = renderIcon?.({ selected: true, hovered: true }) as Element;
    expect(element.getAttribute("data-selected")).toBe("");
    expect(element.getAttribute("data-hovered")).toBe("");
    renderIcon?.(IDLE);
    expect(element.hasAttribute("data-selected")).toBe(false);
    expect(element.hasAttribute("data-hovered")).toBe(false);
  });

  it("is not stamped on nodes that are not elements", () => {
    const text = document.createTextNode("x");
    expect(render({ id: "a", ...at, icon: text }, SELECTED)).toBe(text);
  });
});

describe("sameIconSource", () => {
  it("holds while the icon keeps its reference", () => {
    const node = document.createElement("span");
    expect(
      sameIconSource(
        { id: "a", ...at, icon: node },
        { id: "a", lat: 5, lng: 5, icon: node },
        undefined,
      ),
    ).toBe(true);
    expect(
      sameIconSource(
        { id: "a", ...at, icon: "/a.svg" },
        { id: "a", ...at, icon: "/a.svg" },
        undefined,
      ),
    ).toBe(true);
    expect(sameIconSource({ id: "a", ...at }, { id: "a", ...at, title: "A" }, undefined)).toBe(
      true,
    );
  });

  it("fails when the icon changes", () => {
    expect(
      sameIconSource(
        { id: "a", ...at, icon: "/a.svg" },
        { id: "a", ...at, icon: "/b.svg" },
        undefined,
      ),
    ).toBe(false);
  });

  it("compares the icon each marker draws: its own, else the store's markerIcon", () => {
    const pin = document.createElement("span");
    expect(sameIconSource({ id: "a", ...at }, { id: "a", lat: 5, lng: 5 }, pin)).toBe(true);
    const fromFunction = () => document.createElement("span");
    expect(sameIconSource({ id: "a", ...at }, { id: "a", ...at }, fromFunction)).toBe(false);
  });

  it("fails for a function icon, which is called with the location object itself", () => {
    const icon = () => document.createElement("span");
    expect(sameIconSource({ id: "a", ...at, icon }, { id: "a", ...at, icon }, undefined)).toBe(
      false,
    );
  });
});
