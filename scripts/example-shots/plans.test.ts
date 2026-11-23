import { describe, expect, it } from "vitest";
import { EXAMPLE_SECTIONS } from "../../apps/site/src/examples/example-sections.ts";
import { SHOT_PLANS } from "./plans.ts";
import type { Scene, View } from "./scene.ts";

/** The box an example's places span, and the zoom out its shot needs to hold them all. */
interface Spread {
  readonly south: number;
  readonly north: number;
  readonly west: number;
  readonly east: number;
  readonly widestZoom: number;
}

/** The view `name`'s plan stages its map on, read from a scene that only records it. */
async function stagedView(name: string): Promise<View | undefined> {
  let staged: View | undefined;
  const view = async (asked: View) => {
    staged = asked;
  };
  const scene = { view } as unknown as Scene;
  await SHOT_PLANS.find((plan) => plan.name === name)?.stage?.(scene);
  return staged;
}

/** That `name`'s shot is centred inside its places' box, zoomed out to `widestZoom` or further. */
async function expectFramedAmong(name: string, spread: Spread): Promise<void> {
  const view = await stagedView(name);
  expect(view, `${name} stages no view`).toBeDefined();
  const { center, zoom } = view as View;
  expect(center.lat).toBeGreaterThan(spread.south);
  expect(center.lat).toBeLessThan(spread.north);
  expect(center.lng).toBeGreaterThan(spread.west);
  expect(center.lng).toBeLessThan(spread.east);
  expect(zoom).toBeLessThanOrEqual(spread.widestZoom);
}

describe("SHOT_PLANS", () => {
  it("plans one shot for each example and none other", () => {
    const planned = SHOT_PLANS.map(({ name }) => name);
    expect([...planned].sort()).toEqual(EXAMPLE_SECTIONS.map(({ name }) => name).sort());
    expect(new Set(planned).size).toBe(planned.length);
  });

  it("frames Custom marker icons among its four places, out far enough for all three kinds", () =>
    // Cardiff, London, Manchester and Edinburgh.
    expectFramedAmong("markers", {
      south: 51.48,
      north: 55.95,
      west: -3.19,
      east: -0.13,
      widestZoom: 6,
    }));

  it("frames Default styles off among its four places", () =>
    // Naples, Rome, Venice and Milan.
    expectFramedAmong("unstyled", {
      south: 40.85,
      north: 45.46,
      west: 9.19,
      east: 14.27,
      widestZoom: 6,
    }));
});
