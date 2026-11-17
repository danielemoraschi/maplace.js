import { describe, expect, it } from "vitest";
import type { Drawable } from "../drawable";
import { markerDrawable } from "../testing/conformance/fixtures";
import {
  DOT_RADIUS,
  dotColorAt,
  dotOpacityAt,
  dotRadiusAt,
  HEAT_COLORS,
  heatOpacityAt,
  relativeHeat,
  trackHeaviestHeat,
} from "./heat-look";

describe("heatOpacityAt and dotOpacityAt", () => {
  it("full heat and no dots until the fade, none at maxZoom, mirrored between", () => {
    expect([heatOpacityAt(6, 9), dotOpacityAt(6, 9)]).toEqual([1, 0]);
    expect([heatOpacityAt(7, 9), dotOpacityAt(7, 9)]).toEqual([1, 0]);
    expect([heatOpacityAt(8, 9), dotOpacityAt(8, 9)]).toEqual([0.5, 0.5]);
    expect([heatOpacityAt(9, 9), dotOpacityAt(9, 9)]).toEqual([0, 1]);
    expect([heatOpacityAt(12, 9), dotOpacityAt(12, 9)]).toEqual([0, 1]);
  });
});

describe("trackHeaviestHeat and relativeHeat", () => {
  it("keeps the heaviest weight over heat markers only, 0 with none, and says when it changed", () => {
    const placed = (...drawables: Drawable[]) =>
      drawables.map((drawable) => ({ drawable: () => drawable }));
    const heated = placed(
      markerDrawable("a", undefined, { heatWeight: 2 }),
      markerDrawable("b", undefined, { heatWeight: 5 }),
      markerDrawable("pin"),
    );
    const heaviest = trackHeaviestHeat();
    expect([heaviest.update(heated), heaviest.value()]).toEqual([true, 5]);
    expect(heaviest.update(heated)).toBe(false);
    expect([heaviest.update(placed(markerDrawable("pin"))), heaviest.value()]).toEqual([true, 0]);
  });

  it("a weight against the heaviest, 0 when the heaviest weighs nothing", () => {
    expect(relativeHeat(2, 8)).toBe(0.25);
    expect(relativeHeat(0, 0)).toBe(0);
  });
});

describe("a dot's look", () => {
  it("grows with its relative weight", () => {
    expect(dotRadiusAt(0)).toBe(DOT_RADIUS.min);
    expect(dotRadiusAt(1)).toBe(DOT_RADIUS.max);
  });

  it("takes the heat's colour at its relative weight", () => {
    expect(dotColorAt(0)).toBe(HEAT_COLORS[1]?.[1]);
    expect(dotColorAt(1)).toBe(HEAT_COLORS.at(-1)?.[1]);
    expect(dotColorAt(0.5)).toMatch(/^#[0-9a-f]{6}$/);
  });
});
