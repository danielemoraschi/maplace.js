import { afterEach, expect, it, onTestFinished } from "vitest";
import { SELECTED_PIN_GLYPH } from "../adapter-kit/pin-palette";
import { adding, markerDrawable, presented } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { PIN_IMAGE, pinImageUrl } from "./pin-image";
import { mountedMapLibre } from "./testing/mounted";

afterEach(() => unmountAll());

const UNSET = { background: undefined, border: undefined, glyph: undefined };
const RESTING_URL = () => pinImageUrl(document, UNSET);
const SELECTED_URL = () => pinImageUrl(document, { ...UNSET, glyph: SELECTED_PIN_GLYPH });

/** Two pins on a mounted map, and the images of the pins drawn in front. */
async function twoPins() {
  const { adapter, container, map } = await mountedMapLibre();
  await adapter.apply(adding(markerDrawable("a"), markerDrawable("b")));
  const frontImages = () =>
    [...container.querySelectorAll<HTMLImageElement>("img.maplibregl-marker")].map((image) =>
      image.getAttribute("src"),
    );
  return { adapter, map, frontImages };
}

it("draws the selected pin in front with the darker dot", async () => {
  const { adapter, frontImages } = await twoPins();
  adapter.present(presented({ selectedId: "a" }));
  expect(frontImages()).toEqual([SELECTED_URL()]);
});

it("draws a hovered pin in front in the resting colours", async () => {
  const { adapter, frontImages } = await twoPins();
  adapter.present(presented({ hoveredId: "a" }));
  expect(frontImages()).toEqual([RESTING_URL()]);
});

it("darkens a hovered front pin's dot when it's selected", async () => {
  const { adapter, frontImages } = await twoPins();
  adapter.present(presented({ hoveredId: "a" }));
  adapter.present(presented({ hoveredId: "a", selectedId: "a" }));
  expect(frontImages()).toEqual([SELECTED_URL()]);
});

it("recolours a recycled front pin when it comes back selected", async () => {
  const { adapter, frontImages } = await twoPins();
  adapter.present(presented({ hoveredId: "a" }));
  adapter.present(presented({}));
  adapter.present(presented({ selectedId: "b" }));
  expect(frontImages()).toEqual([SELECTED_URL()]);
});

it("draws the page's pin colours, read from above the map, in the layer and in front", async () => {
  const root = document.documentElement;
  root.style.setProperty("--maplace-pin-background", "#0b6e4f");
  onTestFinished(() => {
    root.style.removeProperty("--maplace-pin-background");
  });
  const { adapter, map, frontImages } = await twoPins();
  adapter.present(presented({ selectedId: "a" }));
  const selected = { ...UNSET, background: "#0b6e4f", glyph: SELECTED_PIN_GLYPH };
  expect(frontImages()).toEqual([pinImageUrl(document, selected)]);
  const image = map.getImage(PIN_IMAGE)?.data;
  // A point of the pin's body, above its dot, in the layer's image drawn at twice the CSS size.
  const at = (8 * (image?.width ?? 0) + 27) * 4;
  expect([...(image?.data.slice(at, at + 3) ?? [])]).toEqual([0x0b, 0x6e, 0x4f]);
});
