import { describe, expect, it } from "vitest";
import { type Box, MARGIN, panShift, type Shift, shiftClear } from "./popup-shift";

const boxOf = (left: number, top: number, width: number, height: number): Box => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
});

/** A phone-width map, as the site's at 375. */
const MAP = boxOf(0, 0, 375, 600);
/** A list in the map's top-right corner. */
const TOP_RIGHT_LIST = boxOf(200, 10, 165, 250);

/** `box` where a pan by `shift` moves it on the page: `panBy` moves the view, so its content goes the other way. */
function moved(box: Box, [x, y]: Shift): Box {
  return { left: box.left - x, right: box.right - x, top: box.top - y, bottom: box.bottom - y };
}

describe("shiftClear", () => {
  it("keeps a popup already inside the map and clear of every control where it is", () => {
    expect(shiftClear(boxOf(20, 300, 150, 100), MAP, [TOP_RIGHT_LIST])).toEqual([0, 0]);
  });

  it("shifts a popup over a top-right list by the least that clears it, keeping the margin", () => {
    const popup = boxOf(67.25, 100.5, 240, 170);
    const shift = shiftClear(popup, MAP, [TOP_RIGHT_LIST]);
    expect(shift).toBeDefined();
    const after = moved(popup, shift as Shift);
    expect(shift?.[0]).toBe(0);
    expect(after.top - TOP_RIGHT_LIST.bottom).toBeCloseTo(MARGIN, 9);
  });

  it("keeps the margin from the map's edges while clearing a control", () => {
    const wideList = boxOf(100, 10, 265, 120);
    const popup = boxOf(170, 20, 200, 100);
    const after = moved(popup, shiftClear(popup, MAP, [wideList]) as Shift);
    expect(after.top - wideList.bottom).toBeCloseTo(MARGIN, 9);
    expect(after.right).toBeLessThanOrEqual(MAP.right - MARGIN);
    expect(after.left).toBeGreaterThanOrEqual(MAP.left + MARGIN);
  });

  it("finds the place clear of two controls, a list in each top corner", () => {
    const topLeft = boxOf(10, 10, 150, 200);
    const popup = boxOf(67, 100, 240, 170);
    const after = moved(popup, shiftClear(popup, MAP, [topLeft, TOP_RIGHT_LIST]) as Shift);
    expect(after.top).toBeGreaterThanOrEqual(TOP_RIGHT_LIST.bottom + MARGIN);
    expect(after.bottom).toBeLessThanOrEqual(MAP.bottom - MARGIN);
  });

  it("finds no place when no shift clears every control inside the map", () => {
    const column = boxOf(130, 10, 235, 580);
    expect(shiftClear(boxOf(67, 100, 240, 170), MAP, [column])).toBeUndefined();
  });

  it("finds no place for a popup larger than the map", () => {
    expect(shiftClear(boxOf(-10, -10, 400, 300), MAP, [])).toBeUndefined();
  });
});

describe("panShift", () => {
  const list = { box: TOP_RIGHT_LIST, coverable: false };
  /** MapLibre's attribution open on a phone, two lines in the bottom-right corner. */
  const attribution = { box: boxOf(10, 545, 355, 45), coverable: true };
  /** A popup centred on a map whose list reaches y 383, as nine places in it do. */
  const popup = boxOf(67, 100, 240, 170);
  const longList = { box: boxOf(200, 10, 165, 373), coverable: false };

  it("pans no map without room, as a hidden one", () => {
    expect(panShift(popup, boxOf(0, 0, 0, 0), [list])).toBeUndefined();
  });

  it("clears every control where there is room", () => {
    const after = moved(popup, panShift(popup, MAP, [list, attribution]) as Shift);
    expect(after.top - TOP_RIGHT_LIST.bottom).toBeCloseTo(MARGIN, 9);
  });

  it("clears all but the attribution, which it may cover, when nothing clears it too", () => {
    expect(shiftClear(popup, MAP, [longList.box, attribution.box])).toBeUndefined();
    const after = moved(popup, panShift(popup, MAP, [longList, attribution]) as Shift);
    expect(after.top - longList.box.bottom).toBeCloseTo(MARGIN, 9);
  });

  it("falls back to the map's edges when even that leaves no room", () => {
    const column = { box: boxOf(130, 10, 235, 580), coverable: false };
    expect(panShift(popup, MAP, [column, attribution])).toEqual([0, 0]);
  });
});
