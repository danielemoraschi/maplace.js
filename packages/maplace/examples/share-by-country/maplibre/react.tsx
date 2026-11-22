import "maplibre-gl/dist/maplibre-gl.css";
import { type ListEntry, type Location, locationsFromGeoJSON } from "@maplacejs/maplace";
import { createMapLibreAdapter } from "@maplacejs/maplace/maplibre";
import { LocationList, MaplaceMap, MaplaceProvider } from "@maplacejs/maplace/react";
import { type CSSProperties, StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

/** What a country's shape and badge carry: its share, and the colour it is drawn in. */
interface CountryShare {
  readonly share: number;
  readonly colour: string;
}

// Each country's share, the colour it is drawn in, and where its badge sits. The shares are
// made up, for the example.
const SHARES = [
  { id: "USA", share: 30, colour: "#1d4ed8", badge: { lat: 33, lng: -98 } },
  { id: "IND", share: 20, colour: "#c2410c", badge: { lat: 16, lng: 78 } },
  { id: "GBR", share: 20, colour: "#15803d", badge: { lat: 51, lng: -1.5 } },
  { id: "BRA", share: 10, colour: "#6d28d9", badge: { lat: -16, lng: -52 } },
  { id: "SAU", share: 10, colour: "#b45309", badge: { lat: 19, lng: 45 } },
  { id: "AUS", share: 10, colour: "#be185d", badge: { lat: -31, lng: 134 } },
];

const FIRST_VIEW = { kind: "fit-all", padding: 48 } as const;

/** Each country in its colour, then its badge: in `SHARES`' order, so the list is too. */
function sharesOn(countries: readonly Location[]): Location<CountryShare>[] {
  return SHARES.flatMap(({ id, share, colour, badge }): Location<CountryShare>[] => {
    const country = countries.find((location) => location.id === id);
    if (country?.type !== "polygon" && country?.type !== "multipolygon") {
      throw new Error(`countries.json has no ${id} to shade`);
    }
    const data = { share, colour };
    return [
      {
        ...country,
        data,
        style: { fill: colour, fillOpacity: 0.85, stroke: "#ffffff", strokeWidth: 1 },
        hoveredStyle: { fillOpacity: 1 },
        selectedStyle: { fillOpacity: 1, stroke: "#111827", strokeWidth: 2 },
      },
      { id: `${id}-badge`, title: `${country.title}: ${share}%`, ...badge, listed: false, data },
    ];
  });
}

const colourOf = (colour = "") => ({ "--colour": colour }) as CSSProperties;

/** A country's share on the map: the figure in a ring of its colour. */
const badgeIcon = ({ data }: Location<CountryShare>) => (
  <span className="share-badge" style={colourOf(data?.colour)}>
    {data?.share}%
  </span>
);

/** A country in the list: its name on its colour, ten dots with its share filled in, the share. */
const shareEntry = ({ location }: ListEntry<CountryShare>) => {
  const { share = 0, colour = "" } = location.data ?? {};
  return (
    <span className="share-entry" style={colourOf(colour)}>
      <span className="share-name">{location.title}</span>
      <span className="share-dots-row">
        <span className="share-dots" aria-hidden="true">
          {Array.from({ length: 10 }, (_, tenth) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: ten dots in a fixed row, by place.
            <span key={tenth} className="share-dot" data-filled={tenth < share / 10 || undefined} />
          ))}
        </span>
        <span className="share-figure">{share}%</span>
      </span>
    </span>
  );
};

function ShareByCountry() {
  const [locations, setLocations] = useState<readonly Location<CountryShare>[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  useEffect(() => {
    fetch("/examples/data/countries.json")
      .then((response) => response.json())
      .then((collection) => setLocations(sharesOn(locationsFromGeoJSON(collection))));
  }, []);
  return (
    <MaplaceProvider
      locations={locations}
      view={FIRST_VIEW}
      selectedId={selectedId}
      // A click on a badge selects its country, as a click on its entry does.
      onSelectionChange={({ id }) => setSelectedId(id?.replace(/-badge$/, ""))}
    >
      <div className="map-and-list">
        <MaplaceMap createAdapter={createMapLibreAdapter} className="map" markerIcon={badgeIcon} />
        <LocationList heading="Share by country" fitAll fitAllLabel="All countries">
          {shareEntry}
        </LocationList>
      </div>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("share-by-country-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <ShareByCountry />
  </StrictMode>,
);
