import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "maplace";
import { createMapLibreAdapter } from "maplace/maplibre";
import { MaplaceMap, MaplaceProvider, useMaplace } from "maplace/react";
import { type ChangeEvent, StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

/** OpenFreeMap's styles, by name; any style URL works: MapTiler's, Stadia's, your own. */
const STYLES = {
  Bright: "https://tiles.openfreemap.org/styles/bright",
  Liberty: "https://tiles.openfreemap.org/styles/liberty",
  Positron: "https://tiles.openfreemap.org/styles/positron",
  Dark: "https://tiles.openfreemap.org/styles/dark",
} as const;

const places: Location[] = [
  { id: "lisbon", lat: 38.7223, lng: -9.1393, title: "Lisbon" },
  { id: "porto", lat: 41.1579, lng: -8.6291, title: "Porto" },
  { id: "coimbra", lat: 40.2033, lng: -8.4103, title: "Coimbra" },
  { id: "faro", lat: 37.0194, lng: -7.9304, title: "Faro" },
];

/** MapLibre's own look: a style, with a compact attribution. */
const adapterIn = (mapStyle: string) => () =>
  createMapLibreAdapter({
    mapStyle,
    mapOptions: { attributionControl: { compact: true } },
  });

/** The style's select: the store keeps where the map is, for the map opened in the new style. */
function StyleSelect({
  mapStyle,
  onChoose,
}: {
  readonly mapStyle: string;
  readonly onChoose: (mapStyle: string) => void;
}) {
  const maplace = useMaplace();
  const choose = (event: ChangeEvent<HTMLSelectElement>) => {
    const { viewport } = maplace.getSnapshot();
    if (viewport) maplace.setView(viewport.center, viewport.zoom);
    onChoose(event.currentTarget.value);
  };
  return (
    <p>
      <label htmlFor="styled-maplibre-react-style">Map style</label>{" "}
      <select
        id="styled-maplibre-react-style"
        autoComplete="off"
        value={mapStyle}
        onChange={choose}
      >
        {Object.entries(STYLES).map(([name, url]) => (
          <option key={url} value={url}>
            {name}
          </option>
        ))}
      </select>
    </p>
  );
}

function Styled() {
  const [mapStyle, setMapStyle] = useState<string>(STYLES.Bright);
  return (
    <MaplaceProvider locations={places}>
      <StyleSelect mapStyle={mapStyle} onChoose={setMapStyle} />
      {/* A map's style is set when it opens: a new key opens a new one. */}
      <MaplaceMap key={mapStyle} createAdapter={adapterIn(mapStyle)} className="map" />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("styled-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <Styled />
  </StrictMode>,
);
