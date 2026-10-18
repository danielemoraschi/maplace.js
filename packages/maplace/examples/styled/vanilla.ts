import { createMaplace, type Location } from "maplace";
import { createGoogleAdapter, type GoogleAdapterOptions } from "maplace/google";

type ColorScheme = GoogleAdapterOptions["colorScheme"];

const locations: Location[] = [
  { id: "lisbon", lat: 38.7223, lng: -9.1393, title: "Lisbon" },
  { id: "porto", lat: 41.1579, lng: -8.6291, title: "Porto" },
  { id: "coimbra", lat: 40.2033, lng: -8.4103, title: "Coimbra" },
  { id: "faro", lat: 37.0194, lng: -7.9304, title: "Faro" },
];

/** Google's own look: a light or dark map, with the map-type control. */
const adapterIn = (colorScheme: ColorScheme) =>
  createGoogleAdapter({ mapId: "DEMO_MAP_ID", colorScheme, mapOptions: { mapTypeControl: true } });

const maplace = createMaplace({ locations });
const container = document.getElementById("styled-vanilla-map") as HTMLElement;
let detach = maplace.attach(adapterIn("light"), container);

// A map's colour scheme is set when it opens: "Dark" opens a new one where this one was.
const dark = document.getElementById("styled-vanilla-dark") as HTMLButtonElement;
dark.addEventListener("click", () => {
  const isDark = dark.getAttribute("aria-pressed") !== "true";
  dark.setAttribute("aria-pressed", String(isDark));
  const { viewport } = maplace.getSnapshot();
  detach();
  if (viewport) maplace.setView(viewport.center, viewport.zoom);
  detach = maplace.attach(adapterIn(isDark ? "dark" : "light"), container);
});
