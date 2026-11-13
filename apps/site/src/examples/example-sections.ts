/** A section of an examples' page: one example, its live map and its code. */
export interface ExampleSection {
  /** Its folder in `packages/maplace/examples/`. */
  readonly name: string;
  readonly title: string;
  readonly summary: string;
  /** Its list drawn its own way (as tabs, or in its own CSS), not in the site's panel beside the map. */
  readonly drawsOwnList?: true;
  /** Its map framed its own way: the site draws no border around it. */
  readonly drawsOwnFrame?: true;
  /** Why it runs on Google only, said in its frame while MapLibre is chosen. */
  readonly googleOnlyBecause?: string;
}

/** A group of the home page's examples: its own page, and a link in the examples' bar. */
export interface ExampleGroup {
  /** Its page's last path segment, `/examples/<id>/`, but for the first group's, the home page. */
  readonly id: string;
  readonly label: string;
  readonly summary: string;
  /** Its page's description, for search and sharing: 80 to 160 characters, unlike the summary it shows. */
  readonly description: string;
  readonly sections: readonly ExampleSection[];
}

/** The home page's title, the first group's page. */
const HOME_TITLE = "Maplace.js: JavaScript library for Google Maps and MapLibre";

/** The examples in their groups, each group a page; the sections numbered in this order (W38). */
export const EXAMPLE_GROUPS: readonly ExampleGroup[] = [
  {
    id: "basics",
    label: "Basics",
    summary: "Places on a map: one pin, your own markers, popups, and a click to add one.",
    description:
      "A list of locations becomes a map in a few lines, with your own markers, popups and a click to add one, on Google Maps or MapLibre.",
    sections: [
      { name: "simple", title: "Simple", summary: "One place on a map." },
      {
        name: "markers",
        title: "Markers",
        summary: "Image icons, an icon of your own markup, and a place with its own zoom.",
      },
      {
        name: "popups",
        title: "Popups",
        summary: "Each place's text in a popup, ending in links to open it in Maps or get there.",
      },
      {
        name: "click-to-add",
        title: "Click to add",
        summary: "A click on the map adds a pin there, and every pin drags to a new place.",
      },
    ],
  },
  {
    id: "lists",
    label: "Lists",
    summary:
      "The list beside the map, your way: a menu, tags, a search box, nearest first, what's in view, your own markup, or tabs.",
    description:
      "Lists beside a map with Maplace.js: a native menu, tags, a search box, nearest first, what's in view, your own markup, or tabs.",
    sections: [
      {
        name: "menu",
        title: "Menu",
        summary: "A native select on the map, grouped by region, with an entry for all.",
      },
      {
        name: "tags",
        title: "Tags",
        summary: "Places with several tags: tick some to see those with all of them.",
      },
      {
        name: "search",
        title: "Search",
        summary: "A box above the list that narrows the list and the map as you type.",
      },
      {
        name: "nearest",
        title: "Nearest first",
        summary: "A button on the map that sorts the list by distance from the visitor.",
      },
      {
        name: "this-area",
        title: "This area",
        summary: "A switch above the list: every place, or only those in view as the map moves.",
      },
      {
        name: "custom-list",
        title: "Your own list",
        summary: "Define your own: here a radio per place, and one to fit all, on the map.",
      },
      {
        name: "tabs",
        title: "Tabs",
        summary: "The list outside the map; a details panel follows the selection.",
        drawsOwnList: true,
      },
    ],
  },
  {
    id: "shapes",
    label: "Shapes",
    summary:
      "Circles, lines, arcs and areas in their own colours, some to edit, and all of them with markers on one map.",
    description:
      "Shapes on a map with Maplace.js: circles, lines, arcs and areas in their own colours, some to edit and save, and all of them with markers on one map.",
    sections: [
      {
        name: "circles",
        title: "Circles",
        summary: "Areas in their own colours, with popups; resize the third and see its radius.",
      },
      { name: "polyline", title: "Polyline", summary: "A trail to edit, with places along it." },
      {
        name: "flights",
        title: "Flights",
        summary: "Arcs from one city to eight; pick a flight in the list.",
      },
      {
        name: "trade-lanes",
        title: "Trade lanes",
        summary: "Air and sea lanes by colour; hover one, pick one for its volume.",
      },
      {
        name: "polygon",
        title: "Polygon",
        summary: "An area to edit: drag a corner, and the edit is written back.",
      },
      {
        name: "mixed",
        title: "Mixed",
        summary: "A marker, a circle, an area and a line on one map and in one list.",
      },
    ],
  },
  {
    id: "data-routes",
    label: "Data & routes",
    summary:
      "Data fetched and swapped in live, thousands of points clustered, a drive through your places, a map loaded on a press, a link to a place.",
    description:
      "Data swapped in live with Maplace.js, thousands of points clustered, a drive, a map loaded on a press, and a link to a place.",
    sections: [
      {
        name: "live-data",
        title: "Live data",
        summary:
          "Data sets, fetched and swapped in live: markers, an area, a circle, and on Google a route.",
      },
      {
        name: "big",
        title: "Cluster",
        summary: "4,000 points, those near each other drawn as one badge counting them.",
      },
      {
        name: "route",
        title: "Route",
        summary: "A drive through your own places, passing through one, with directions by leg.",
        googleOnlyBecause: "MapLibre has no routing.",
      },
      {
        name: "load-on-demand",
        title: "Load on demand",
        summary: "A panel in the map's place: nothing draws until the visitor presses its button.",
      },
      {
        name: "link-to-place",
        title: "Link to a place",
        summary: "A link to the place picked, shown under the map, that opens the map on it.",
      },
    ],
  },
  {
    id: "styling",
    label: "Styling",
    summary: "Your map's look: the provider's own styles, and Maplace.js's parts drawn your way.",
    description:
      "Style a map with Maplace.js: the provider's own basemaps, your own markers and colours, or none of Maplace.js's styles.",
    sections: [
      {
        name: "whats-on",
        title: "Your own look",
        summary:
          "A dark frame, pins coloured by category, a legend that filters them and a card of the venues, or of the one picked.",
        drawsOwnFrame: true,
      },
      {
        name: "styled",
        title: "Basemaps",
        summary:
          "The provider's own looks: a choice of styles, and on Google the map-type control.",
      },
      {
        name: "css-markers",
        title: "Your markers",
        summary: "Pins of your own markup, their hovered and selected looks in your CSS.",
      },
      {
        name: "brand",
        title: "Brand colours",
        summary: "One palette across the delivery areas, the cluster badges and the list.",
        drawsOwnList: true,
      },
      {
        name: "unstyled",
        title: "Default styles off",
        summary:
          "Maplace.js's styles off and nothing in their place: the map and its list as your page shows them, with no CSS but a height.",
      },
    ],
  },
];

/** Every example, in its groups' order. */
export const EXAMPLE_SECTIONS: readonly ExampleSection[] = EXAMPLE_GROUPS.flatMap(
  ({ sections }) => sections,
);

/** The group on the home page: the first. */
export const HOME_GROUP: ExampleGroup = EXAMPLE_GROUPS[0] as ExampleGroup;

const isHomeGroup = (group: ExampleGroup) => group.id === HOME_GROUP.id;

/** `section`'s number on the site, `1` for the first, counted across the groups in order. */
export function sectionNumber(section: ExampleSection): number {
  return EXAMPLE_SECTIONS.indexOf(section) + 1;
}

/** The path of `group`'s page: the home page for the first group. */
export function groupPath(group: ExampleGroup): string {
  return isHomeGroup(group) ? "/" : `/examples/${group.id}/`;
}

/** The title of `group`'s page: the home page's for the first group. */
export function groupTitle(group: ExampleGroup): string {
  return isHomeGroup(group) ? HOME_TITLE : `${group.label}: Maplace.js examples`;
}

/** The description of `group`'s page. */
export function groupDescription(group: ExampleGroup): string {
  return group.description;
}

/** The group whose page is at `path`, if any: `location.pathname`, say. */
export function findGroupAtPath(path: string): ExampleGroup | undefined {
  return EXAMPLE_GROUPS.find((group) => groupPath(group) === path);
}

/** The group holding the section named `name`, if any: a URL's hash, say. */
export function findGroupOfSection(name: string): ExampleGroup | undefined {
  return EXAMPLE_GROUPS.find(({ sections }) => sections.some((section) => section.name === name));
}
