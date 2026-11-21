// The examples page's words (W72); its route, `EXAMPLES_PAGE_ROUTE`, heads `EXAMPLES_ROUTES`.
import { pageHeading } from "./example-sections.ts";

/** The examples page's H1, on one line. */
export const EXAMPLES_HEADING = pageHeading("Live examples");

/** What an index of every example says first: under the examples page's H1, and under the home page's Examples heading. */
export const EXAMPLES_INTRO =
  "Every example by feature, each a live map with its code for HTML, a script, a bundler and React.";

/** The examples page's description, for search and sharing. */
export const EXAMPLES_DESCRIPTION =
  "Every Maplace.js example by feature: markers, lists, search, shapes, routes, clusters, live data and styling, on Google Maps and MapLibre.";
