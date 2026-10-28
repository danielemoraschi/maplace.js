import "maplibre-gl/dist/maplibre-gl.css";
import { createMaplace, type Location } from "maplace";
import { createMapLibreAdapter } from "maplace/maplibre";

const locations: Location[] = [
  { id: "lisbon", lat: 38.7223, lng: -9.1393, title: "Lisbon" },
  { id: "porto", lat: 41.1579, lng: -8.6291, title: "Porto" },
  { id: "coimbra", lat: 40.2033, lng: -8.4103, title: "Coimbra" },
  { id: "faro", lat: 37.0194, lng: -7.9304, title: "Faro" },
];

/**
 * MapLibre's own look: a style, here one of OpenFreeMap's the page offers (any style URL works:
 * MapTiler's, Stadia's, your own), with a compact attribution.
 */
const adapterIn = (mapStyle: string) =>
  createMapLibreAdapter({
    mapStyle,
    mapOptions: { attributionControl: { compact: true } },
  });

const maplace = createMaplace({ locations });
const styleSelect = document.querySelector("#styled-maplibre-vanilla-style") as HTMLSelectElement;
let detach = maplace.attach(adapterIn(styleSelect.value), "#styled-maplibre-vanilla-map");

// A map's style is set when it opens: choosing one opens a new map where this one was.
styleSelect.addEventListener("change", () => {
  const { viewport } = maplace.getSnapshot();
  detach();
  if (viewport) maplace.setView(viewport.center, viewport.zoom);
  detach = maplace.attach(adapterIn(styleSelect.value), "#styled-maplibre-vanilla-map");
});
