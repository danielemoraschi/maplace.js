import { API_LISTS } from "../../../../packages/maplace/src/__typetests__/api-lists.ts";
import {
  POPUP_CLASS,
  POPUP_HEADING_CLASS,
} from "../../../../packages/maplace/src/adapter-kit/popup-content.ts";
import {
  PANE_CLASS,
  PLACED_LIST_CLASS,
} from "../../../../packages/maplace/src/element/default-styles.ts";
import { elementEventName } from "../../../../packages/maplace/src/element/event-forwarding.ts";
import { LOCATION_ATTRIBUTES } from "../../../../packages/maplace/src/element/location-attributes.ts";
import {
  CONTROL_CLASS,
  GOOGLE_MAP_CLASS,
} from "../../../../packages/maplace/src/google/control-styles.ts";
import { LIST_VIEW_CLASS } from "../../../../packages/maplace/src/list-view.ts";
import { eventPropName } from "../../../../packages/maplace/src/react/store-binding.ts";
import { UNSTYLED_ATTRIBUTE } from "../../../../packages/maplace/src/unstyled.ts";
import { LIST_CLASS, LIST_HEADING_CLASS } from "../../../../packages/maplace/src/views/headed.ts";
import {
  FIT_ALL_CLASS,
  GROUP_CLASS,
  HEADING_CLASS,
  LISTBOX_CLASS,
  OPTION_CLASS,
} from "../../../../packages/maplace/src/views/listbox-nodes.ts";
import { SELECT_CLASS } from "../../../../packages/maplace/src/views/native-select.ts";
import { PACKAGE_ENTRIES, readRootFile } from "../../../../scripts/build/package.ts";
import { GOOGLE_PROVIDER_ATTRIBUTES, MAP_ATTRIBUTES } from "./element-attributes.ts";
import { exportedNames } from "./entry-exports.ts";
import type { ReferenceTable } from "./reference-check.ts";
import { LOCATION_FIELDS, SHAPE_STYLE_FIELDS, STORE_NAMES } from "./reference-names.ts";
import {
  GOOGLE_MAP_OPTIONS,
  GOOGLE_OPTIONS,
  MAP_ELEMENT_PROPERTIES,
  REACT_PROPS,
} from "./reference-names-bindings.ts";

/** Where the reference pages are, from the repo root. */
export const REFERENCE_DIR = "docs/reference/";

/** Every class maplace puts on what it draws: the Styling page's classes, for the page's CSS. */
export const STYLING_CLASSES = [
  PANE_CLASS,
  PLACED_LIST_CLASS,
  LIST_VIEW_CLASS,
  LIST_CLASS,
  LIST_HEADING_CLASS,
  LISTBOX_CLASS,
  GROUP_CLASS,
  HEADING_CLASS,
  OPTION_CLASS,
  FIT_ALL_CLASS,
  SELECT_CLASS,
  POPUP_CLASS,
  POPUP_HEADING_CLASS,
  CONTROL_CLASS,
  GOOGLE_MAP_CLASS,
];

/** A table of a page: its heading, the names it lists, and where they come from. */
type TableOf = readonly [heading: string, names: readonly string[], source: string];

/** Every table of the reference pages that lists the API's names, and where they come from. */
export function referenceTables(): ReferenceTable[] {
  return [
    ...tablesOn("locations.md", [
      ["## Every location", LOCATION_FIELDS.common, "every location type"],
      ["## Markers", LOCATION_FIELDS.marker, "MarkerLocation"],
      ["## Circles", LOCATION_FIELDS.circle, "CircleLocation"],
      ["## Polylines", LOCATION_FIELDS.polyline, "PolylineLocation"],
      ["## Polygons", LOCATION_FIELDS.polygon, "PolygonLocation"],
      ["## Styles", SHAPE_STYLE_FIELDS, "ShapeStyle"],
    ]),
    ...tablesOn("store.md", [
      ["## Options", STORE_NAMES.options, "MaplaceOptions"],
      ["## Popup options", STORE_NAMES.popupOptions, "PopupOptions"],
      ["## Methods", STORE_NAMES.methods, "Maplace"],
      ["## Snapshot", STORE_NAMES.snapshot, "Snapshot"],
      ["## Events", API_LISTS.events, "MaplaceEventName"],
      ["## Routes", STORE_NAMES.route, "Route"],
      ["## List view options", STORE_NAMES.listViewOptions, "ListViewOptions"],
    ]),
    ...tablesOn("element.md", [
      ["## Map attributes", MAP_ATTRIBUTES, "the attributes <maplace-map> reads"],
      ["## Properties and methods", MAP_ELEMENT_PROPERTIES, "MaplaceMapElement"],
      ["## Events", API_LISTS.events.map(elementEventName), "MaplaceElementEventMap"],
      ["## Location attributes", LOCATION_ATTRIBUTES, "the attributes <maplace-location> reads"],
    ]),
    ...tablesOn("google.md", [
      ["## Options", GOOGLE_OPTIONS, "GoogleAdapterOptions"],
      ["## `createGoogleMap`", GOOGLE_MAP_OPTIONS, "GoogleMapOptions and GoogleMapList"],
      [
        "## Provider attributes",
        GOOGLE_PROVIDER_ATTRIBUTES,
        "the attributes the Google provider reads",
      ],
    ]),
    ...tablesOn("react.md", [
      ["## `<MaplaceProvider>`", REACT_PROPS.provider, "MaplaceProviderProps"],
      ["## Event props", API_LISTS.events.map(eventPropName), "MaplaceEventProps"],
      ["## `<MaplaceMap>`", REACT_PROPS.map, "MaplaceMapProps"],
      ["## `<LocationList>`", REACT_PROPS.list, "LocationListProps"],
      ["## `<MapControl>`", REACT_PROPS.control, "MapControlProps"],
    ]),
    ...tablesOn("styling.md", [
      ["## Turning them off", [UNSTYLED_ATTRIBUTE], "unstyled.ts"],
      ["## Classes", STYLING_CLASSES, "the classes maplace's markup carries"],
    ]),
    ...tablesOn("api.md", [
      ...entryTables(),
      ["## Misuse codes", API_LISTS.misuseCodes, "MisuseCode"],
      ["## Runtime failures", API_LISTS.runtimeCodes, "RuntimeCode"],
      ["## Capabilities", API_LISTS.capabilities, "Capability"],
    ]),
  ];
}

function tablesOn(page: string, tables: readonly TableOf[]): ReferenceTable[] {
  const doc = `${REFERENCE_DIR}${page}`;
  return tables.map(([heading, names, source]) => ({ doc, heading, names, source }));
}

/** The package's entries, as the API page heads them. */
const ENTRY_NAMES: Readonly<Record<keyof typeof PACKAGE_ENTRIES, string>> = {
  core: "maplace",
  google: "maplace/google",
  maplibre: "maplace/maplibre",
  element: "maplace/element",
  elementGoogle: "maplace/element/google",
  elementMapLibre: "maplace/element/maplibre",
  react: "maplace/react",
};

/** One table per entry: its exports, read from its source. */
function entryTables(): TableOf[] {
  const entries = Object.entries(ENTRY_NAMES) as [keyof typeof PACKAGE_ENTRIES, string][];
  return entries.map(([entry, name]) => [
    `## \`${name}\``,
    exportedNames(readRootFile(PACKAGE_ENTRIES[entry])),
    `the ${name} entry`,
  ]);
}
