import { NavigationControl } from "maplibre-gl";
import { afterEach, describe, expect, it, onTestFinished } from "vitest";
import type { ControlPosition } from "../adapter";
import { places } from "../google/testing/places";
import { createListView } from "../list-view";
import { createMaplace } from "../maplace/create";
import { panelOf } from "./testing/control-site";
import { mapOfWidthIn } from "./testing/map-of-width";

afterEach(() => {
  document.body.replaceChildren();
});

/** Half a pixel either way, as boxes land on fractions. */
const NEAR = 0.5;

/** As wide as a page may make a control, so that on a phone it shares a column with the others. */
const WIDE = "250px";

/**
 * A store of 30 places on a map `width` px wide: `list` places a list view of it in a corner,
 * `button` a page's button, each `WIDE` if asked, and gives back its panel's box as laid out at
 * the time asked.
 */
async function crowdedMap(width: number) {
  const maplace = createMaplace({ locations: places(30) });
  const site = await mapOfWidthIn(maplace, width);
  const mount = (node: HTMLElement, corner: ControlPosition, wide: boolean) => {
    if (wide) node.style.width = WIDE;
    site.adapter.mountControl(node, corner);
    return () => panelOf(node).getBoundingClientRect();
  };
  const list = (corner: ControlPosition, wide = false) => {
    const view = createListView(maplace);
    onTestFinished(() => view.destroy());
    return mount(view.element, corner, wide);
  };
  const button = (corner: ControlPosition, wide = false) =>
    mount(Object.assign(document.createElement("button"), { textContent: "Mine" }), corner, wide);
  const mapBox = () => site.map.getContainer().getBoundingClientRect();
  return { ...site, list, button, mapBox };
}

function expectWithin(inner: DOMRect, outer: DOMRect): void {
  expect(inner.top).toBeGreaterThanOrEqual(outer.top - NEAR);
  expect(inner.bottom).toBeLessThanOrEqual(outer.bottom + NEAR);
}

function expectAbove(upper: DOMRect, lower: DOMRect, gap = 10): void {
  expect(upper.bottom).toBeLessThanOrEqual(lower.top - gap + NEAR);
}

describe.each([1280, 375])("the corners of a crowded MapLibre map %i px wide", (width) => {
  it("keeps a long top-left list 10px above a bottom-left panel", async () => {
    const { list, button } = await crowdedMap(width);
    const topLeft = list("top-left");
    const bottomLeft = button("bottom-left");
    expectAbove(topLeft(), bottomLeft());
  });

  it("keeps a long top-right list 10px above MapLibre's attribution", async () => {
    const { list, attribution } = await crowdedMap(width);
    const topRight = list("top-right");
    expectAbove(topRight(), attribution().getBoundingClientRect());
  });

  it("splits a column between two long lists, both within the map and scrolling", async () => {
    const { list, mapBox } = await crowdedMap(width);
    const topLeft = list("top-left");
    const bottomLeft = list("bottom-left");
    expectAbove(topLeft(), bottomLeft());
    expectWithin(topLeft(), mapBox());
    expectWithin(bottomLeft(), mapBox());
    expect(bottomLeft().height).toBeGreaterThan(mapBox().height / 4);
  });

  it("keeps a top-right control and a long bottom-right list apart, the list taking the rest of the column", async () => {
    const { list, map, mapBox } = await crowdedMap(width);
    map.addControl(new NavigationControl(), "top-right");
    const bottomRight = list("bottom-right");
    const navigation = map.getContainer().querySelector(".maplibregl-ctrl-group") as Element;
    expectAbove(navigation.getBoundingClientRect(), bottomRight());
    expect(bottomRight().height).toBeGreaterThan(mapBox().height * 0.6);
  });
});

describe("the corners of a crowded MapLibre map on a phone", () => {
  it("lifts a bottom-left panel 10px above a phone's two-line attribution, a long top-left list above it", async () => {
    const { list, button, attribution } = await crowdedMap(375);
    const topLeft = list("top-left");
    const bottomLeft = button("bottom-left");
    const credits = attribution().getBoundingClientRect();
    expect(credits.height).toBeGreaterThanOrEqual(36);
    expect(credits.left).toBeLessThan(bottomLeft().right);
    expectAbove(bottomLeft(), credits);
    expectAbove(topLeft(), bottomLeft());
  });

  it("keeps a long bottom-right list and a bottom-left panel both on a phone's map, apart", async () => {
    const { list, button, mapBox } = await crowdedMap(375);
    const bottomRight = list("bottom-right", true);
    const bottomLeft = button("bottom-left", true);
    expectWithin(bottomRight(), mapBox());
    expectWithin(bottomLeft(), mapBox());
    expectAbove(bottomLeft(), bottomRight());
  });

  it("gives a top-right list room beside a long bottom-left list on a phone", async () => {
    const { list } = await crowdedMap(375);
    const bottomLeft = list("bottom-left", true);
    const topRight = list("top-right", true);
    expect(bottomLeft().height).toBeGreaterThan(100);
    expect(topRight().height).toBeGreaterThan(100);
    expectAbove(topRight(), bottomLeft());
  });
});

describe("the corners of a MapLibre map wide enough", () => {
  it("leaves a bottom-left panel at the map's foot beside a one-line attribution", async () => {
    const { button, mapBox } = await crowdedMap(1280);
    const bottomLeft = button("bottom-left");
    expect(bottomLeft().bottom).toBeCloseTo(mapBox().bottom - 10, 0);
  });
});
