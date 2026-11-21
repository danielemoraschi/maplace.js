import { afterEach, expect, it, onTestFinished } from "vitest";
import { pinImageUrl } from "../adapter-kit/pin-image";
import { pinLooksOf } from "../adapter-kit/pin-looks";
import { adding, markerDrawable, presented } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { PIN_IMAGE } from "./layers";
import { mountedMapLibre } from "./testing/mounted";

afterEach(() => unmountAll());

const looks = () => pinLooksOf(document.body);
const urlOf = (look: keyof ReturnType<typeof looks>) => pinImageUrl(document, looks()[look]);

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

it("draws the selected pin in front, larger, in its halo", async () => {
  const { adapter, frontImages } = await twoPins();
  adapter.present(presented({ selectedId: "a" }));
  expect(frontImages()).toEqual([urlOf("selected")]);
});

it("draws a hovered pin in front, larger", async () => {
  const { adapter, frontImages } = await twoPins();
  adapter.present(presented({ hoveredId: "a" }));
  expect(frontImages()).toEqual([urlOf("hovered")]);
});

it("draws a selected and hovered pin as selected", async () => {
  const { adapter, frontImages } = await twoPins();
  adapter.present(presented({ hoveredId: "a" }));
  adapter.present(presented({ hoveredId: "a", selectedId: "a" }));
  expect(frontImages()).toEqual([urlOf("selected")]);
});

it("repaints a recycled front pin when it comes back selected", async () => {
  const { adapter, frontImages } = await twoPins();
  adapter.present(presented({ hoveredId: "a" }));
  adapter.present(presented({}));
  adapter.present(presented({ selectedId: "b" }));
  expect(frontImages()).toEqual([urlOf("selected")]);
});

it("draws the page's colours, read from above the map, in the layer and in front", async () => {
  const root = document.documentElement;
  root.style.setProperty("--maplace-pin-background", "#0b6e4f");
  onTestFinished(() => {
    root.style.removeProperty("--maplace-pin-background");
  });
  const { adapter, map, frontImages } = await twoPins();
  adapter.present(presented({ selectedId: "a" }));
  expect(frontImages()).toEqual([pinImageUrl(document, pinLooksOf(root).selected)]);
  const image = map.getImage(PIN_IMAGE)?.data;
  const width = image?.width ?? 0;
  // The middle of the layer's image: the dot.
  const at = ((width / 2) * width + width / 2) * 4;
  expect([...(image?.data.slice(at, at + 3) ?? [])]).toEqual([0x0b, 0x6e, 0x4f]);
});
