import "maplibre-gl/dist/maplibre-gl.css";
import { type Location, locationsFromGeoJSON } from "@maplacejs/maplace";
import { createMapLibreAdapter } from "@maplacejs/maplace/maplibre";
import { LocationList, MapControl, MaplaceMap, MaplaceProvider } from "@maplacejs/maplace/react";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

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
 * strength, which its neighbours' outlines can't hide, and a dark outline.
 */
const OUTLINE = { stroke: "#ffffff", strokeWidth: 1, fillOpacity: 0.75 };
const HOVERED = { stroke: "#111827", strokeWidth: 2, fillOpacity: 1 };
/** The world from Europe and Africa, where the globe opens too, rather than fitted round it. */
const FIRST_VIEW = { kind: "center", center: { lat: 20, lng: 10 }, zoom: 2 } as const;
const dollars = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** A country filled in its class's colour, its value in the popup hovering it opens. */
function shaded(country: Location<Country>): Location<Country> {
  if (country.type !== "polygon" && country.type !== "multipolygon") return country;
  const value = country.data?.gdpPerPerson ?? null;
  const content = value === null ? NO_DATA.label : `${dollars.format(value)} per person`;
  return {
    ...country,
    style: { ...OUTLINE, fill: classOf(value).fill },
    hoveredStyle: HOVERED,
    content,
  };
}

function classOf(value: number | null) {
  return value === null ? NO_DATA : (CLASSES.find(({ below }) => value < below) ?? NO_DATA);
}

/** The legend: each class with its colour, then the countries' select, for the keyboard. */
function Legend() {
  return (
    <div className="choropleth-legend">
      <p className="choropleth-legend-title">GDP per person</p>
      <ul className="choropleth-classes">
        {[...CLASSES, NO_DATA].map(({ fill, label }) => (
          <li key={label}>
            <span className="choropleth-swatch" style={{ background: fill }} />
            {label}
          </li>
        ))}
      </ul>
      <LocationList as="select" label="Country" />
    </div>
  );
}

// The earth as a globe, with a toggle on the map to flatten it.
const onTheGlobe = () => createMapLibreAdapter({ globe: true });

function Choropleth() {
  const [countries, setCountries] = useState<readonly Location<Country>[]>([]);
  useEffect(() => {
    fetch("/examples/data/countries.json")
      .then((response) => response.json())
      .then((collection) => setCountries(locationsFromGeoJSON<Country>(collection).map(shaded)));
  }, []);
  return (
    <MaplaceProvider locations={countries} popup={{ openOn: "hover" }} view={FIRST_VIEW}>
      <MaplaceMap createAdapter={onTheGlobe} className="map">
        <MapControl position="bottom-left">
          <Legend />
        </MapControl>
      </MaplaceMap>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("choropleth-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <Choropleth />
  </StrictMode>,
);
