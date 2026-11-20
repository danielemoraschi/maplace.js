import { circlesPolygons } from "./groups/circles-polygons.ts";
import { clustersHeatmaps } from "./groups/clusters-heatmaps.ts";
import { linesRoutes } from "./groups/lines-routes.ts";
import { lists } from "./groups/lists.ts";
import { liveData } from "./groups/live-data.ts";
import { markers } from "./groups/markers.ts";
import { search } from "./groups/search.ts";
import { styling } from "./groups/styling.ts";

/** An example: a page of its own under its feature's hub, its live map and its code. */
export interface ExampleSection {
  /** Its folder in `packages/maplace/examples/`. */
  readonly name: string;
  readonly title: string;
  readonly summary: string;
  /** Its page's description, for search and sharing: 80 to 160 characters, unlike its summary. */
  readonly description: string;
  /** Its list drawn its own way (as tabs, or in its own CSS), not in the site's panel beside the map. */
  readonly drawsOwnList?: true;
  /** Its map framed its own way: the site draws no border around it. */
  readonly drawsOwnFrame?: true;
}

/** Where a hub cuts a reference table: the doc's id in `REPO_DOCS`, the heading's line. */
export interface ReferenceCut {
  readonly doc: string;
  /** The heading line exactly, `## Markers`, as `reference-check.ts` names a table. */
  readonly heading: string;
}

/** A feature's examples: a hub page listing them, and the side column's and home page's heading over them. */
export interface ExampleGroup {
  /** Its page's last path segment, `/examples/<id>/`. */
  readonly id: string;
  readonly label: string;
  /** Its page's H1, before `HEADING_TAIL`: the feature, in the words a search uses. */
  readonly headingLead: string;
  /** The paragraph under its page's H1: what its examples show, in a sentence. */
  readonly intro: string;
  /** What the index of examples says of it, on the home page and the examples page (`ExampleCategories.astro`). */
  readonly summary: string;
  /** Its page's description, for search and sharing: 80 to 160 characters, unlike the summary it shows. */
  readonly description: string;
  /** The reference tables its page shows, cut from the docs (`group-references-loader.ts`). */
  readonly references: readonly ReferenceCut[];
  readonly sections: readonly ExampleSection[];
}

/** The examples by feature, each feature a hub; the examples numbered in this order (D31). */
export const EXAMPLE_GROUPS: readonly ExampleGroup[] = [
  markers,
  lists,
  search,
  circlesPolygons,
  linesRoutes,
  clustersHeatmaps,
  liveData,
  styling,
];
