// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { markerDrawable, ORIGIN, presented } from "../testing/conformance/fixtures";
import { DOTS_OPACITY, UNDER_HEAT_ATTRIBUTE } from "./heat-dot";
import { createGoogleHeat } from "./heat-overlay";
import { placeMarker } from "./marker";
import type { StubMap } from "./testing/stub-libraries";
import { stubSite } from "./testing/stub-site";

const WORLD = { south: -80, west: -180, north: 80, east: 180 };

/** A heatmap below zoom 9 opened on a stub map showing `zoom`, with one heat marker on it. */
function heatAt(zoom: number) {
  const heat = createGoogleHeat(9);
  const stub = stubSite(undefined, heat);
  const map = stub.mounted.map as unknown as StubMap;
  map.shown = { center: { lat: 0, lng: 0 }, zoom, bounds: WORLD };
  const container = map.getDiv();
  Object.defineProperty(container, "clientWidth", { value: 400 });
  Object.defineProperty(container, "clientHeight", { value: 200 });
  const placed = placeMarker(markerDrawable("q", ORIGIN, { heatWeight: 2 }), stub.site);
  stub.state.placed.set("q", placed);
  heat.open(stub.mounted, stub.state);
  const canvas = () => map.overlayLayer.querySelector("canvas");
  return { ...stub, map, container, heat, canvas };
}

describe("the heat overlay on Google", () => {
  it("hides the dots under the heat, from when it is added, and fades them in over the 2 zooms before maxZoom", () => {
    const { map, container } = heatAt(3);
    expect(container.hasAttribute(UNDER_HEAT_ATTRIBUTE)).toBe(true);
    expect(container.style.getPropertyValue(DOTS_OPACITY)).toBe("0");
    map.shown = { center: { lat: 0, lng: 0 }, zoom: 8, bounds: WORLD };
    map.trigger("zoom_changed");
    expect(container.hasAttribute(UNDER_HEAT_ATTRIBUTE)).toBe(false);
    expect(container.style.getPropertyValue(DOTS_OPACITY)).toBe("0.5");
  });

  it("places its canvas over the view, in the overlay pane, at the heat's opacity", () => {
    const { canvas } = heatAt(8);
    // At zoom 8 the world is 65,536 pixels wide: its middle, where the view is centred, is 32,768.
    expect(canvas()?.style).toMatchObject({
      left: `${32_768 - 200}px`,
      top: `${32_768 - 100}px`,
      width: "400px",
      height: "200px",
      opacity: "0.5",
    });
  });

  it("draws again on a presentation only when what is hidden changed", () => {
    const { heat, state, canvas } = heatAt(3);
    const drawnAt = () => canvas()?.style.left;
    canvas()?.style.setProperty("left", "0px");
    state.presented = presented({ selectedId: "q" });
    heat.presented();
    // A new presentation object, but the same hidden ids: still drawn as it was.
    expect(drawnAt()).toBe("0px");
    state.presented = presented({ hiddenIds: new Set(["q"]) });
    heat.presented();
    expect(drawnAt()).not.toBe("0px");
  });

  it("draws again after a diff only when it changed the heat", () => {
    const { heat, state, site, canvas } = heatAt(3);
    heat.drawn();
    const drawnAt = () => canvas()?.style.left;
    canvas()?.style.setProperty("left", "0px");
    heat.drawn();
    expect(drawnAt()).toBe("0px");
    state.placed.set("r", placeMarker(markerDrawable("r", ORIGIN, { heatWeight: 1 }), site));
    heat.drawn();
    expect(drawnAt()).not.toBe("0px");
  });

  it("weighs the dots against a new heaviest after a diff", () => {
    const { heat, state } = heatAt(8);
    const dot = () => state.placed.get("q");
    const sizeOf = () =>
      (dot() as { marker: HTMLElement }).marker.querySelector<HTMLElement>(".maplace-heat-dot")
        ?.style.width;
    const before = sizeOf();
    heat.drawn();
    expect(sizeOf()).not.toBe(before);
  });

  it("takes its canvas, attribute and opacity off on destroy", () => {
    const { container, canvas, close } = heatAt(3);
    close();
    expect(canvas()).toBeNull();
    expect(container.hasAttribute(UNDER_HEAT_ATTRIBUTE)).toBe(false);
    expect(container.style.getPropertyValue(DOTS_OPACITY)).toBe("");
  });
});
