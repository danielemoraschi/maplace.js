import type { Location } from "maplace";
import { createGoogleAdapter, type GoogleAdapterOptions } from "maplace/google";
import { MaplaceMap, MaplaceProvider, useMaplace } from "maplace/react";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

type ColorScheme = GoogleAdapterOptions["colorScheme"];

const places: Location[] = [
  { id: "lisbon", lat: 38.7223, lng: -9.1393, title: "Lisbon" },
  { id: "porto", lat: 41.1579, lng: -8.6291, title: "Porto" },
  { id: "coimbra", lat: 40.2033, lng: -8.4103, title: "Coimbra" },
  { id: "faro", lat: 37.0194, lng: -7.9304, title: "Faro" },
];

/** Google's own look: a light or dark map, with the map-type control. */
const adapterIn = (colorScheme: ColorScheme) => () =>
  createGoogleAdapter({ mapId: "DEMO_MAP_ID", colorScheme, mapOptions: { mapTypeControl: true } });

/** "Dark": the store keeps where the map is, for the map opened in the other scheme. */
function DarkToggle({ dark, onToggle }: { readonly dark: boolean; readonly onToggle: () => void }) {
  const maplace = useMaplace();
  const toggle = () => {
    const { viewport } = maplace.getSnapshot();
    if (viewport) maplace.setView(viewport.center, viewport.zoom);
    onToggle();
  };
  return (
    <button type="button" aria-pressed={dark} onClick={toggle}>
      Dark
    </button>
  );
}

function Styled() {
  const [dark, setDark] = useState(false);
  const scheme = dark ? "dark" : "light";
  return (
    <MaplaceProvider locations={places}>
      <DarkToggle dark={dark} onToggle={() => setDark(!dark)} />
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
