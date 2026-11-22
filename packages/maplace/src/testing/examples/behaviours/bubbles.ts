import { expect } from "vitest";
import { isMarkerLocation } from "../../../location";
import { isInBox, unwrapped } from "../../../view-box";
import type { Bounds } from "../../../viewport";
import { clickButton, type ExampleBehaviour, listedIn, textIn } from "./reading";

/** The cities' populations by id, from `cities.json`: what every version draws and lists. */
async function fetchPopulations(): Promise<ReadonlyMap<string, number>> {
  const response = await fetch("/examples/data/cities.json");
  const cities = (await response.json()) as { id: string; data: { population: number } }[];
  return new Map(cities.map(({ id, data }) => [id, data.population]));
}

/** A bubble's width for `population`: its area the population, Tokyo's 37M 56px across, none under 6px. */
const bubbleWidth = (population: number) => Math.max(6, Math.sqrt(population / 37e6) * 56);

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/** The width a marker's bubble was drawn at, in pixels: the icon, or in the node React fills. */
function widthOf(icon: unknown): number {
  if (!(icon instanceof HTMLElement)) return 0;
  const bubble = icon.matches(".bubble") ? icon : icon.querySelector<HTMLElement>(".bubble");
  return Number.parseFloat(bubble?.style.width ?? "") || 0;
}

/**
 * Cities as bubbles, each as big as its population says and the legend's circles too, largest
 * first; each entry gives its population; after a move the count under the map is what is in
 * view, and "This area" lists the same cities.
 */
export const bubbles: ExampleBehaviour = async ({ store, adapter, root }) => {
  const probe = adapter.probe();
  await expect.poll(() => store.getSnapshot().locations.length).toBeGreaterThan(0);
  const cities = store.getSnapshot().locations.filter(isMarkerLocation);
  const populations = await fetchPopulations();
  const populationOf = ({ id }: { id: string }) => populations.get(id) ?? Number.NaN;
  await expect
    .poll(() => widthOf(probe.location(cities.at(-1)?.id ?? "")?.icon))
    .toBeGreaterThan(0);
  for (const city of cities) {
    expect(widthOf(probe.location(city.id)?.icon), city.id).toBeCloseTo(
      bubbleWidth(populationOf(city)),
      0,
    );
  }
  // As it reads, whether the legend is built by a script or written in the page.
  expect(textIn(root, ".bubbles-legend")?.replaceAll(/\s+/g, "")).toBe("Population30M10M3M");
  const legend = [...(root?.querySelectorAll(".bubbles-legend .bubble") ?? [])].map(widthOf);
  expect(legend.map(Math.round)).toEqual(
    [30e6, 10e6, 3e6].map((size) => Math.round(bubbleWidth(size))),
  );
  await expect.poll(() => textIn(root, '[role="option"] .bubbles-population')).toBe("37M");

  store.setView({ lat: 48, lng: 10 }, 4);
  await probe.settle();
  const box = unwrapped(store.getSnapshot().viewport?.bounds as Bounds);
  const inView = cities.filter((city) => isInBox(city, box));
  const people = inView.reduce((sum, city) => sum + populationOf(city), 0);
  expect(inView.length).toBeGreaterThan(0);
  await expect
    .poll(() => textIn(root, "output"))
    .toBe(`${inView.length} cities · ${compact.format(people)} people`);

  clickButton(root, "This area");
  await expect
    .poll(() => listedIn(root))
    .toEqual(inView.map((city) => `${city.title}${compact.format(populationOf(city))}`));
};
