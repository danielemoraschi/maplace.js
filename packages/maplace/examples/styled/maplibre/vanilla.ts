import "maplibre-gl/dist/maplibre-gl.css";
import { createMaplace, type Location } from "maplace";
import { createMapLibreAdapter } from "maplace/maplibre";

/** OpenFreeMap's light and dark styles; any style URL works: MapTiler's, Stadia's, your own. */
const STYLES = {
  light: "https://tiles.openfreemap.org/styles/liberty",
  dark: "https://tiles.openfreemap.org/styles/dark",
} as const;

type Scheme = keyof typeof STYLES;

const locations: Location[] = [
  { id: "lisbon", lat: 38.7223, lng: -9.1393, title: "Lisbon" },
  { id: "porto", lat: 41.1579, lng: -8.6291, title: "Porto" },
  { id: "coimbra", lat: 40.2033, lng: -8.4103, title: "Coimbra" },
  { id: "faro", lat: 37.0194, lng: -7.9304, title: "Faro" },
];

/** MapLibre's own look: a light or dark style, with a compact attribution. */
const adapterIn = (scheme: Scheme) =>
  createMapLibreAdapter({
    mapStyle: STYLES[scheme],
    mapOptions: { attributionControl: { compact: true } },
  });

const maplace = createMaplace({ locations });
let dark = false;
let detach = maplace.attach(adapterIn("light"), "#styled-maplibre-vanilla-map");

// A map's style is set when it opens: the button opens a new one where this one was, and names
// the style it switches to.
const schemeButton = document.querySelector<HTMLButtonElement>("#styled-maplibre-vanilla-scheme");
schemeButton?.addEventListener("click", () => {
  dark = !dark;
  schemeButton.textContent = dark ? "Light theme" : "Dark theme";
  const { viewport } = maplace.getSnapshot();
  detach();
  if (viewport) maplace.setView(viewport.center, viewport.zoom);
  detach = maplace.attach(adapterIn(dark ? "dark" : "light"), "#styled-maplibre-vanilla-map");
});
