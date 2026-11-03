import {
  OLD_LOCATION_FIELDS,
  OLD_OPTIONS,
} from "../../../../packages/maplace/src/validate/migration.ts";

const NO_ROUTING = "MapLibre has no routing";
const LIST_POSITION = "use list-position: a corner of the map, or outside, beside it";

const listenFor = (event: string) => `listen for the element's maplace-${event} event`;
const listenAfter = (event: string) => `${listenFor(event)}, which follows the change`;

const option = (hint: string) => `is a 0.2 option; ${hint}`;
const callback = (hint: string) => `is a 0.2 callback; ${hint}`;
const field = (hint: string) => `is a 0.2 field; ${hint}`;

/** Options whose hint in `migration.ts` is true of the store's API, not of the element's. */
const OPTIONS_ON_THE_ELEMENT: Readonly<Record<string, string>> = {
  map_options: option(
    "use map-options, a JSON object of your provider's own map options (Google's and MapLibre's names differ), without a centre or zoom: those are the center and zoom attributes",
  ),
  controls_div: option(LIST_POSITION),
  controls_position: option(LIST_POSITION),
  listeners: option(
    "for a click on the map, listen for the element's maplace-mapclick event; for any other map event, a script passes its own map to the provider's adapter",
  ),
  debug: option(listenFor("error")),
  pan_on_click: option("leave it out: the map always pans to a clicked location"),
  infowindow_type: option("leave it out: a location's html is its popup"),
  styles: option(
    "on Google, use map-id with Cloud styling, and color-scheme; on MapLibre, map-style",
  ),
  directions_options: option(
    `on Google, set travelMode and avoid in the element's route property; ${NO_ROUTING}`,
  ),
  directions_panel: option(
    `on Google, render each leg's steps from the maplace-routechange event; ${NO_ROUTING}`,
  ),
};

/** 0.2's callbacks, under the events the element fires for them (MIGRATION's Events table). */
const CALLBACKS: Readonly<Record<string, string>> = {
  beforeViewAll: callback(listenAfter("selectionchange")),
  beforeShow: callback(listenAfter("selectionchange")),
  afterShow: callback(listenFor("selectionchange")),
  onPolylineClick: callback(listenFor("selectionchange")),
  onPolygonClick: callback(listenFor("selectionchange")),
  onPolylineChanged: callback(listenFor("locationchange")),
  onPolygonChanged: callback(listenFor("locationchange")),
  afterViewAll: callback("listen for maplace-selectionchange and maplace-viewportchange"),
  beforeOpenInfowindow: callback(listenAfter("popupopen")),
  afterOpenInfowindow: callback(listenFor("popupopen")),
  beforeCloseInfowindow: callback(listenAfter("popupclose")),
  afterCloseInfowindow: callback(listenFor("popupclose")),
  afterCreateMarker: callback(
    "leave it out: style markers with CSS on data-selected and data-hovered",
  ),
  afterRoute: callback(`on Google, listen for maplace-routechange; ${NO_ROUTING}`),
  circleRadiusChanged: callback(listenFor("locationchange")),
  circleCenterChanged: callback(listenFor("locationchange")),
  dragEnd: callback(listenFor("locationchange")),
  drag: callback(listenFor("locationedit")),
  dragStart: callback("the first maplace-locationedit comes as a drag starts"),
};

const OPTION_WORDS: Readonly<Record<string, string>> = {
  ...OLD_OPTIONS,
  ...OPTIONS_ON_THE_ELEMENT,
  ...CALLBACKS,
};

const FIELDS_ON_THE_ELEMENT: Readonly<Record<string, string>> = {
  stopover: field(
    `on Google, list the stop's id under via in the element's route property; ${NO_ROUTING}`,
  ),
  infoWindowMaxWidth: field(
    "the element has no setting for it: size the popup's content with CSS on .maplace-popup",
  ),
};

const FIELD_WORDS: Readonly<Record<string, string>> = {
  ...OLD_LOCATION_FIELDS,
  ...FIELDS_ON_THE_ELEMENT,
};

const wordsIn = (table: Readonly<Record<string, string>>, name: string, otherwise: string) =>
  Object.hasOwn(table, name) ? (table[name] as string) : otherwise;

/** What the page says of the config's option `name`, on a snippet of either provider. */
export function legacyOptionWords(name: string): string {
  return wordsIn(OPTION_WORDS, name, "isn't a 0.2 option this page carries over");
}

/** What the page says of a config's `type` that draws nothing of its own. */
export function legacyTypeWords(type: unknown): string {
  return type === "directions"
    ? option(`on Google, a script sets the element's route property; ${NO_ROUTING}`)
    : option("set type per location");
}

/** What the page says of the location field `name`, on a snippet of either provider. */
export function legacyFieldWords(name: string): string {
  return wordsIn(FIELD_WORDS, name, "isn't a location field");
}
