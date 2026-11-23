import { expect, it, vi } from "vitest";
import { pinRadiusOf } from "../adapter-kit/pin-image";
import { pinLooksOf } from "../adapter-kit/pin-looks";
import { places } from "../google/testing/places";
import { createMaplace } from "../maplace/create";
import { sizedContainer } from "../testing/container";
import { CREDITED_OPTIONS, onMapLibreIn } from "./testing/control-site";
import { mapOfWidthIn } from "./testing/map-of-width";
import { RENDER_WAIT, renderedIds } from "./testing/rendered";
import { pagePointOf } from "./testing/user-drags";

/** Where `p0`, the lowest of `places()`, is. */
const LOWEST = { lat: 40, lng: 5 };

const SELECTED_RADIUS = pinRadiusOf(pinLooksOf(document.body).selected);

it.each([375, 260])(
  "fits a %ipx map with the lowest location's dot above the attribution, open, its credit in",
  async (width) => {
    const maplace = createMaplace({ locations: places(6) });
    const { map, attribution } = await mapOfWidthIn(maplace, width);
    await vi.waitFor(() => expect(renderedIds(map, ["maplace-pins"])).toContain("p0"), RENDER_WAIT);
    expect(attribution().classList.contains("maplibregl-compact-show")).toBe(true);
    // Fitted again once the style's credit, which comes after the first render, fills it.
    await expect
      .poll(() => pagePointOf(map, LOWEST).y + SELECTED_RADIUS, RENDER_WAIT)
      .toBeLessThanOrEqual(attribution().getBoundingClientRect().top);
  },
);

it("fits a map whose page asks for a compact attribution, hidden until its credit comes", async () => {
  const maplace = createMaplace({ locations: places(6) });
  const options = { ...CREDITED_OPTIONS, mapOptions: { attributionControl: { compact: true } } };
  const { map } = await onMapLibreIn(maplace, sizedContainer(), options);
  await vi.waitFor(
    () =>
      expect(renderedIds(map, ["maplace-pins"]).sort()).toEqual([
        "p0",
        "p1",
        "p2",
        "p3",
        "p4",
        "p5",
      ]),
    RENDER_WAIT,
  );
  expect(map.getZoom()).toBeGreaterThan(2);
});
