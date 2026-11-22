import type { Bounds, ListEntry, Location, MarkerLocation } from "@maplacejs/maplace";
import { createGoogleAdapter } from "@maplacejs/maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "@maplacejs/maplace/react";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

/** What a city's bubble and entry show. */
interface City {
  readonly population: number;
}

const FIRST_VIEW = { kind: "fit-all", padding: 32 } as const;
// Tokyo's 37M, the largest city in the file, is 56px across; a bubble's area is its population.
const LARGEST = 37e6;
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

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

/** A circle as big as `population`, none under 6px across. */
function Bubble({ population }: { readonly population: number }) {
  const diameter = Math.max(6, Math.sqrt(population / LARGEST) * 56);
  return <span className="bubble" style={{ width: diameter, height: diameter }} />;
}

const markerIcon = ({ data }: Location<City>) => <Bubble population={data?.population ?? 0} />;

/** A city in the list: its name, then its population. */
const cityEntry = ({ location }: ListEntry<City>) => (
  <span className="bubbles-city">
    {location.title}
    <span className="bubbles-population">{compact.format(location.data?.population ?? 0)}</span>
  </span>
);

function Bubbles() {
  // The file lists the largest first, so the small bubbles are drawn over the big ones.
  const [cities, setCities] = useState<readonly MarkerLocation<City>[]>([]);
  const [bounds, setBounds] = useState<Bounds>();
  useEffect(() => {
    fetch("/examples/data/cities.json")
      .then((response) => response.json())
      .then(setCities);
  }, []);
  return (
    <MaplaceProvider
      locations={cities}
      view={FIRST_VIEW}
      onViewportChange={({ viewport }) => setBounds(viewport.bounds)}
    >
      <div className="map-and-list">
        <MaplaceMap createAdapter={createGoogleAdapter} className="map" markerIcon={markerIcon} />
        <LocationList heading="Cities" scope="viewport">
          {cityEntry}
        </LocationList>
      </div>
      <p className="bubbles-legend">
        Population
        {[30e6, 10e6, 3e6].map((population) => (
          <span key={population} className="bubbles-size">
            <span aria-hidden="true">
              <Bubble population={population} />
            </span>
            {compact.format(population)}
          </span>
        ))}
      </p>
      <p>
        Now in view{" "}
        <output>{bounds ? summaryOf(cities.filter((city) => inView(city, bounds))) : "–"}</output>
      </p>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("bubbles-react-root") as HTMLElement).render(
  <StrictMode>
    <Bubbles />
  </StrictMode>,
);
