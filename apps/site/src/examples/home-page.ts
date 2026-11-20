import { pageHeading } from "./example-sections.ts";

/** The home page: the library, then every example by feature (`ExampleIndex.astro`). */
export const HOME_ROUTE = "/";

/** The home page's H1's first line, before `HEADING_TAIL`. */
export const HOME_HEADING_LEAD = "A JavaScript library for markers";

/** The hero's paragraph under the home page's H1. */
export const HOME_INTRO =
  "Maplace.js puts your locations on Google Maps or MapLibre: markers, shapes and routes, and the list or menu that goes with them, in sync with the map. One script tag, with a Maps key on Google and none on MapLibre; npm and React too.";

/** The home page's description, for search and sharing. */
export const HOME_DESCRIPTION =
  "A JavaScript library for Google Maps and MapLibre: a list of locations becomes a map with markers, popups and a click to add one, in a few lines.";

/** The home page's H1, on one line. */
export const HOME_HEADING = pageHeading(HOME_HEADING_LEAD);
