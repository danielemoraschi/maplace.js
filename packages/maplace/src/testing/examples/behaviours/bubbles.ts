import { expect } from "vitest";
import { isMarkerLocation, type Location } from "../../../location";
import { isInBox, unwrapped } from "../../../view-box";
import type { Bounds } from "../../../viewport";
import { clickButton, type ExampleBehaviour, listedIn, textIn } from "./reading";

/** A city's population, as its data carries it. */
const populationOf = ({ data }: Location) => (data as { population: number }).population;

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/** The width a marker's bubble was drawn at, in pixels: the icon, or in the node React fills. */
function widthOf(icon: unknown): number {
  if (!(icon instanceof HTMLElement)) return 0;
  const bubble = icon.matches(".bubble") ? icon : icon.querySelector<HTMLElement>(".bubble");
  return Number.parseFloat(bubble?.style.width ?? "") || 0;
}

/**
 * Cities as bubbles sized by population, largest first in the data; each entry gives its
 * population; the legend reads its sizes; after a move the count under the map is what is in view, and
 * "This area" lists the same cities.
 */
export const bubbles: ExampleBehaviour = async ({ store, adapter, root }) => {
  const probe = adapter.probe();
  await expect.poll(() => store.getSnapshot().locations.length).toBeGreaterThan(0);
  const cities = store.getSnapshot().locations.filter(isMarkerLocation);
  const [largest, smallest] = [cities.at(0)?.id ?? "", cities.at(-1)?.id ?? ""];
  await expect.poll(() => widthOf(probe.location(smallest)?.icon)).toBeGreaterThan(0);
  expect(widthOf(probe.location(largest)?.icon)).toBeGreaterThan(
    widthOf(probe.location(smallest)?.icon),
  );
  expect(textIn(root, ".bubbles-legend")).toBe("Population30M10M3M");
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
