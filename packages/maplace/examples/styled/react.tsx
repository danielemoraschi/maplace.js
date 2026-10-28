import type { Location } from "maplace";
import { createGoogleAdapter, type GoogleAdapterOptions } from "maplace/google";
import { MaplaceMap, MaplaceProvider, useMaplace } from "maplace/react";
import { type ChangeEvent, StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

type ColorScheme = NonNullable<GoogleAdapterOptions["colorScheme"]>;

const SCHEMES = {
  light: "Light",
  dark: "Dark",
  "follow-system": "Follow the system",
} satisfies Record<ColorScheme, string>;

const places: Location[] = [
  { id: "lisbon", lat: 38.7223, lng: -9.1393, title: "Lisbon" },
  { id: "porto", lat: 41.1579, lng: -8.6291, title: "Porto" },
  { id: "coimbra", lat: 40.2033, lng: -8.4103, title: "Coimbra" },
  { id: "faro", lat: 37.0194, lng: -7.9304, title: "Faro" },
];

/**
 * Google's own look: a light or dark map, or the reader's system scheme, with the map-type
 * control. A map's Cloud styling hangs on its map ID: put your own in `mapId`.
 */
const adapterIn = (colorScheme: ColorScheme) => () =>
  createGoogleAdapter({ mapId: "DEMO_MAP_ID", colorScheme, mapOptions: { mapTypeControl: true } });

/** The scheme's select: the store keeps where the map is, for the map opened in the new scheme. */
function SchemeSelect({
  scheme,
  onChoose,
}: {
  readonly scheme: ColorScheme;
  readonly onChoose: (scheme: ColorScheme) => void;
}) {
  const maplace = useMaplace();
  const choose = (event: ChangeEvent<HTMLSelectElement>) => {
    const { viewport } = maplace.getSnapshot();
    if (viewport) maplace.setView(viewport.center, viewport.zoom);
    onChoose(event.currentTarget.value as ColorScheme);
  };
  return (
    <p>
      <label htmlFor="styled-react-scheme">Map style</label>{" "}
      <select id="styled-react-scheme" autoComplete="off" value={scheme} onChange={choose}>
        {Object.entries(SCHEMES).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </p>
  );
}

function Styled() {
  const [scheme, setScheme] = useState<ColorScheme>("light");
  return (
    <MaplaceProvider locations={places}>
      <SchemeSelect scheme={scheme} onChoose={setScheme} />
      {/* A map's colour scheme is set when it opens: a new key opens a new one. */}
      <MaplaceMap key={scheme} createAdapter={adapterIn(scheme)} className="map" />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("styled-react-root") as HTMLElement).render(
  <StrictMode>
    <Styled />
  </StrictMode>,
);
