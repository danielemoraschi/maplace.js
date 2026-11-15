import "maplibre-gl/dist/maplibre-gl.css";
import {
  createListView,
  createMaplace,
  type Location,
  locationsFromGeoJSON,
} from "@maplacejs/maplace";
import { createMapLibreAdapter } from "@maplacejs/maplace/maplibre";

/** What the file says of a country: its GDP per person in US dollars, null where it has none. */
interface Country {
  readonly gdpPerPerson: number | null;
}

/**
 * The legend's classes, lowest first, each with its colour: a scale colour-blind readers can tell
 * apart.
 */
const CLASSES = [
  { below: 1_500, fill: "#ffffcc", label: "Under $1,500" },
  { below: 4_000, fill: "#a1dab4", label: "$1,500–4,000" },
  { below: 10_000, fill: "#41b6c4", label: "$4,000–10,000" },
  { below: 30_000, fill: "#2c7fb8", label: "$10,000–30,000" },
  { below: Number.POSITIVE_INFINITY, fill: "#253494", label: "Over $30,000" },
];
const NO_DATA = { fill: "#d1d5db", label: "No data" };
/**
 * Every country's outline, white between neighbours; under the pointer, its colour at full
 * strength and a dark outline; selected, a wider one.
 */
const OUTLINE = { stroke: "#ffffff", strokeWidth: 1, fillOpacity: 0.75 };
const HOVERED = { stroke: "#111827", strokeWidth: 2, fillOpacity: 1 };
const SELECTED = { ...HOVERED, strokeWidth: 3 };
const dollars = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const maplace = createMaplace<Country>({
  popup: { openOn: "hover" },
  // The world from Europe and Africa, where the globe opens too, rather than fitted round it.
  view: { kind: "center", center: { lat: 20, lng: 10 }, zoom: 2 },
});
// The earth as a globe, with a toggle on the map to flatten it.
const adapter = createMapLibreAdapter({ globe: true });
maplace.attach(adapter, "#choropleth-maplibre-vanilla-map");
const countries = createListView(maplace, { as: "select", label: "Country" });
adapter.mountControl(legendWith(countries.element), "bottom-left");

const response = await fetch("/examples/data/countries.json");
maplace.setLocations(locationsFromGeoJSON<Country>(await response.json()).map(shaded));

/** A country filled in its class's colour, its value in the popup hovering it opens. */
function shaded(country: Location<Country>): Location<Country> {
  if (country.type !== "polygon" && country.type !== "multipolygon") return country;
  const value = country.data?.gdpPerPerson ?? null;
  const content = value === null ? NO_DATA.label : `${dollars.format(value)} per person`;
  return {
    ...country,
    style: { ...OUTLINE, fill: classOf(value).fill },
    hoveredStyle: HOVERED,
    selectedStyle: SELECTED,
    content,
  };
}

function classOf(value: number | null) {
  return value === null ? NO_DATA : (CLASSES.find(({ below }) => value < below) ?? NO_DATA);
}

/** The legend: each class with its colour, then the countries' select, for the keyboard. */
function legendWith(select: HTMLElement): HTMLElement {
  const legend = document.createElement("div");
  legend.className = "choropleth-legend";
  const title = document.createElement("p");
  title.className = "choropleth-legend-title";
  title.textContent = "GDP per person";
  const classes = document.createElement("ul");
  classes.className = "choropleth-classes";
  classes.append(...[...CLASSES, NO_DATA].map(legendEntry));
  legend.append(title, classes, select);
  return legend;
}

function legendEntry({ fill, label }: { fill: string; label: string }): HTMLLIElement {
  const entry = document.createElement("li");
  const swatch = document.createElement("span");
  swatch.className = "choropleth-swatch";
  swatch.style.background = fill;
  entry.append(swatch, label);
  return entry;
}
