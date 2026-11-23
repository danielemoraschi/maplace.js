// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { CONTROL_CLASS } from "./control-styles";
import {
  deeperInsets,
  insetsLeavingRoom,
  measurePanelInsets,
  NO_INSETS,
  panelInsets,
  reachesInto,
  sizeClearOf,
} from "./panel-insets";

/** A 375 × 400 map at the page's origin. */
const MAP = { left: 0, top: 0, right: 375, bottom: 400 };
const box = (left: number, top: number, right: number, bottom: number) => ({
  left,
  top,
  right,
  bottom,
});

describe("panelInsets", () => {
  it("pads the top by a wide, short panel in the top-right corner", () => {
    expect(panelInsets(MAP, [box(190, 10, 365, 75)])).toEqual({ ...NO_INSETS, top: 75 });
  });

  it("pads the left by a tall, narrow panel on the left", () => {
    expect(panelInsets(MAP, [box(10, 10, 110, 390)])).toEqual({ ...NO_INSETS, left: 110 });
  });

  it("pads the bottom by a short panel in a bottom corner", () => {
    expect(panelInsets(MAP, [box(10, 340, 200, 390)])).toEqual({ ...NO_INSETS, bottom: 60 });
  });

  it("keeps the deepest reach on a side two panels pad", () => {
    const insets = panelInsets(MAP, [box(10, 10, 150, 50), box(200, 10, 365, 80)]);
    expect(insets).toEqual({ ...NO_INSETS, top: 80 });
  });

  it("clamps a panel partly off the map, and ignores one wholly off it", () => {
    expect(panelInsets(MAP, [box(190, -40, 365, 30)])).toEqual({ ...NO_INSETS, top: 30 });
    expect(panelInsets(MAP, [box(400, 10, 500, 60), box(10, -80, 100, -10)])).toEqual(NO_INSETS);
  });

  it("ignores a panel with no size, and gives none for no panels or a map with no size", () => {
    expect(panelInsets(MAP, [box(10, 10, 10, 10)])).toEqual(NO_INSETS);
    expect(panelInsets(MAP, [])).toEqual(NO_INSETS);
    expect(panelInsets(box(0, 0, 0, 0), [box(0, 0, 50, 50)])).toEqual(NO_INSETS);
  });
});

describe("reachesInto", () => {
  const leftList = { ...NO_INSETS, left: 260 };

  it("finds a panel grown into what a fit kept clear", () => {
    expect(reachesInto(MAP, [box(10, 10, 300, 200)], leftList)).toBe(true);
  });

  it("finds none for a fractional panel narrowed within the insets it was counted at", () => {
    const counted = panelInsets(MAP, [box(10, 10, 260.4, 390)]);
    expect(reachesInto(MAP, [box(10, 10, 260.4, 100)], counted)).toBe(false);
  });

  it("finds none for a panel still within what the fit kept clear, whichever edge it counts on", () => {
    // A tall list narrowed to a short box by a search: counted on the top now, still on the left.
    expect(reachesInto(MAP, [box(10, 10, 250, 100)], leftList)).toBe(false);
  });
});

describe("measurePanelInsets", () => {
  it("reads the boxes of maplace's panels under the map, and nothing else", () => {
    const container = document.createElement("div");
    container.getBoundingClientRect = () => DOMRect.fromRect({ width: 375, height: 400 });
    const panel = document.createElement("div");
    panel.className = CONTROL_CLASS;
    panel.getBoundingClientRect = () => DOMRect.fromRect({ x: 190, y: 10, width: 175, height: 65 });
    const other = document.createElement("div");
    other.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: 0, width: 375, height: 200 });
    container.append(panel, other);
    expect(measurePanelInsets(container)).toEqual({ ...NO_INSETS, top: 75 });
  });
});

describe("insetsLeavingRoom", () => {
  const size = { width: 375, height: 400 };

  it("keeps insets that leave at least a quarter of the map after the padding", () => {
    const insets = { ...NO_INSETS, top: 75 };
    expect(insetsLeavingRoom(insets, size, 40)).toEqual(insets);
  });

  it("drops an axis whose insets and padding would leave less than a quarter of the map", () => {
    const insets = { ...NO_INSETS, top: 75, left: 220 };
    expect(insetsLeavingRoom(insets, size, 40)).toEqual({ ...NO_INSETS, top: 75 });
  });
});

describe("the insets' arithmetic", () => {
  it("takes the insets off a size", () => {
    expect(sizeClearOf({ width: 375, height: 400 }, { ...NO_INSETS, top: 75, left: 25 })).toEqual({
      width: 350,
      height: 325,
    });
  });

  it("keeps the deeper of two insets on each side", () => {
    expect(
      deeperInsets({ ...NO_INSETS, top: 10, bottom: 30 }, { ...NO_INSETS, bottom: 20 }),
    ).toEqual({ ...NO_INSETS, top: 10, bottom: 30 });
  });
});
