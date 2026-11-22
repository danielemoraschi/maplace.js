import "maplibre-gl/dist/maplibre-gl.css";
import type { Bounds, ListEntry, Location, MarkerLocation } from "@maplacejs/maplace";
import { createMapLibreMap } from "@maplacejs/maplace/maplibre";

/** What a city's bubble and entry show. */
interface City {
  readonly population: number;
}

// Tokyo's 37M, the largest city in the file, is 56px across; a bubble's area is its population.
const LARGEST = 37e6;
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/** A circle as big as `population`, none under 6px across. */
function bubble(population: number): HTMLElement {
  const circle = document.createElement("span");
  circle.className = "bubble";
  const diameter = Math.max(6, Math.sqrt(population / LARGEST) * 56);
  circle.style.width = circle.style.height = `${diameter}px`;
  return circle;
}

/** A city in the list: its name, then its population. */
function cityEntry({ location }: ListEntry<City>): Node {
  const entry = document.createElement("span");
  entry.className = "bubbles-city";
  const population = document.createElement("span");
  population.className = "bubbles-population";
  population.textContent = compact.format(location.data?.population ?? 0);
  entry.append(location.title ?? "", population);
  return entry;
}

/** Whether `city` is inside `bounds`, which may cross the antimeridian (`west > east`). */
function inView({ lat, lng }: MarkerLocation<City>, { north, south, east, west }: Bounds): boolean {
  const inLongitude = west <= east ? lng >= west && lng <= east : lng >= west || lng <= east;
  return lat >= south && lat <= north && inLongitude;
}

/** How many cities, and how many people in them: "12 cities · 210M people". */
function summaryOf(cities: readonly Location<City>[]): string {
  const people = cities.reduce((sum, { data }) => sum + (data?.population ?? 0), 0);
  return `${cities.length} cities · ${compact.format(people)} people`;
}

const maplace = createMapLibreMap<City>("#bubbles-maplibre-vanilla-map", {
  view: { kind: "fit-all", padding: 32 },
  list: {
    container: "#bubbles-maplibre-vanilla-list",
    heading: "Cities",
    scope: "viewport",
    render: cityEntry,
  },
});

// The legend's sizes, drawn as the bubbles are.
for (const population of [30e6, 10e6, 3e6]) {
  const size = document.createElement("span");
  size.className = "bubbles-size";
  const circle = bubble(population);
  circle.setAttribute("aria-hidden", "true");
  size.append(circle, compact.format(population));
  document.querySelector("#bubbles-maplibre-vanilla-legend")?.append(size);
}

// The file lists the largest first, so the small bubbles are drawn over the big ones.
const cities: MarkerLocation<City>[] = await (await fetch("/examples/data/cities.json")).json();
maplace.setLocations(
  cities.map((city) => ({ ...city, icon: () => bubble(city.data?.population ?? 0) })),
);

// What the map shows: now, if it has settled while the file loaded, then after each move.
const inViewNow = document.querySelector<HTMLOutputElement>("#bubbles-maplibre-vanilla-in-view");
function showInView(bounds: Bounds | undefined): void {
  if (inViewNow && bounds)
    inViewNow.value = summaryOf(cities.filter((city) => inView(city, bounds)));
}
showInView(maplace.getSnapshot().viewport?.bounds);
maplace.on("viewportChange", ({ viewport }) => showInView(viewport.bounds));
