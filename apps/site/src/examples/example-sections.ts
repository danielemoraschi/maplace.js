/** A section of an examples' page: one example, its live map and its code. */
export interface ExampleSection {
  /** Its folder in `packages/maplace/examples/`. */
  readonly name: string;
  readonly title: string;
  readonly summary: string;
  /** Its list drawn its own way (as tabs, or in its own CSS), not in the site's panel beside the map. */
  readonly drawsOwnList?: true;
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
const HOME_TITLE = "maplacejs: a JavaScript library for Google Maps and MapLibre";

/** The examples in their groups, each group a page; the sections numbered in this order (W38). */
export const EXAMPLE_GROUPS: readonly ExampleGroup[] = [
  {
    id: "basics",
    label: "Basics",
    summary: "Places on a map: one pin, then image markers with popups.",
    description:
      "A list of locations becomes a map plus a synced list, in a few lines, on Google Maps or MapLibre.",
    sections: [
      { name: "simple", title: "Simple", summary: "One place on a map." },
      {
        name: "markers",
        title: "Markers",
        summary:
          "Three kinds of pin, popups, a list on the map, one place unlisted: click the map to add one.",
      },
    ],
  },
  {
    id: "lists",
    label: "Lists",
    summary: "The list beside the map, your way: a menu, your own markup, or tabs outside the map.",
    description:
      "Lists beside a map with maplacejs: a native menu, your own markup through a list view, or tabs outside the map.",
    sections: [
      {
        name: "menu",
        title: "Menu",
        summary: "A native select on the map, grouped by region, with an entry for all.",
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
    summary: "Circles, lines and areas, drawn in their own colours, some of them to edit.",
    description:
      "Shapes on a map with maplacejs: circles, lines and areas in their own colours, some of them to edit and save.",
    sections: [
      {
        name: "circles",
        title: "Circles",
        summary: "Areas in their own colours, with popups; resize the third and see its radius.",
      },
      { name: "polyline", title: "Polyline", summary: "A trail to edit, with places along it." },
      {
        name: "polygon",
        title: "Polygon",
        summary: "An area to edit: drag a corner, and the edit is written back.",
      },
    ],
  },
  {
    id: "data-routes",
    label: "Data & routes",
    summary:
      "Data fetched and swapped in live, thousands of points clustered, and a drive through your own places.",
    description:
      "Data fetched and swapped in live with maplacejs, thousands of points clustered, and a drive through your own places.",
    sections: [
      {
        name: "mixed",
        title: "Mixed",
        summary:
          "Data sets, fetched and swapped in live: markers, an area, a circle, and on Google a route.",
      },
      {
        name: "big",
        title: "Cluster",
        summary: "4,000 points, clustered, listing what is in view.",
      },
      {
        name: "route",
        title: "Route",
        summary: "A drive through your own places, passing through one, with directions by leg.",
        googleOnlyBecause: "MapLibre has no routing.",
      },
    ],
  },
  {
    id: "styling",
    label: "Styling",
    summary: "Your map's look: the provider's own styles, and maplace's parts drawn your way.",
    description:
      "Style a map with maplacejs: the provider's own basemaps, your own markers and colours, or none of maplace's styles.",
    sections: [
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
        title: "Unstyled",
        summary: "maplace's own styles off: the page's CSS draws the list and the popups.",
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
  return isHomeGroup(group) ? HOME_TITLE : `${group.label}: maplacejs examples`;
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
