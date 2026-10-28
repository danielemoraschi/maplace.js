import { createMaplace, type Location } from "maplace";
import { createGoogleAdapter, type GoogleAdapterOptions } from "maplace/google";

type ColorScheme = NonNullable<GoogleAdapterOptions["colorScheme"]>;

const locations: Location[] = [
  { id: "lisbon", lat: 38.7223, lng: -9.1393, title: "Lisbon" },
  { id: "porto", lat: 41.1579, lng: -8.6291, title: "Porto" },
  { id: "coimbra", lat: 40.2033, lng: -8.4103, title: "Coimbra" },
  { id: "faro", lat: 37.0194, lng: -7.9304, title: "Faro" },
];

/**
 * Google's own look: a light or dark map, or the reader's system scheme, with the map-type
 * control. A map's Cloud styling hangs on its map ID: put your own in `mapId`.
 */
const adapterIn = (colorScheme: ColorScheme) =>
  createGoogleAdapter({ mapId: "DEMO_MAP_ID", colorScheme, mapOptions: { mapTypeControl: true } });

const maplace = createMaplace({ locations });
const schemeSelect = document.querySelector("#styled-vanilla-scheme") as HTMLSelectElement;
const chosenScheme = () => schemeSelect.value as ColorScheme;
let detach = maplace.attach(adapterIn(chosenScheme()), "#styled-vanilla-map");

// A map's colour scheme is set when it opens: choosing one opens a new map where this one was.
schemeSelect.addEventListener("change", () => {
  const { viewport } = maplace.getSnapshot();
  detach();
  if (viewport) maplace.setView(viewport.center, viewport.zoom);
  detach = maplace.attach(adapterIn(chosenScheme()), "#styled-vanilla-map");
});
