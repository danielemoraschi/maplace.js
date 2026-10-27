// 0.2 names and what to use in 1.0, as short hints for error messages. Source: RFC §4.

const LON_HINT = "use lng";

/** 0.2 location fields. */
const LOCATION_FIELDS_0_2: Readonly<Record<string, string>> = {
  lon: LON_HINT,
  draggable: "use editable",
  show_infowindow: "leave content out",
  infoWindowMaxWidth: "use the popup.maxWidth option",
  image: "use an icon node, e.g. a sized <img>",
  image_w: "use an icon node, e.g. a sized <img>",
  image_h: "use an icon node, e.g. a sized <img>",
  animation: "animate the icon node with CSS",
  stopover: "list the stop's id in route.via to pass through it",
  stroke_options: "use style",
  circle_options: "use style",
  zIndex: "leave it out: markers stack by hover and selection, shapes by size",
  on_menu: "use listed: false",
  pan_on_click: "leave it out: the map always pans to a clicked location",
};

/** 0.2 options of `new Maplace({…})`. */
const OPTIONS_0_2: Readonly<Record<string, string>> = {
  map_div: "pass it to createGoogleMap or attach: '#map' works",
  controls_div: "use createGoogleMap's list: { container }, or createListView",
  controls_on_map: "use createGoogleMap's list: { position }, or createListView",
  controls_position: "use createGoogleMap's list: { position }, or createListView",
  generate_controls: "use createListView",
  force_generate_controls: "use createListView",
  controls_type: "use createListView(maplace, { as })",
  controls_cssclass: "style the list with your own classes",
  controls_applycss: "style the list with your own classes",
  controls_title: "use the list view's heading option",
  type: "set type per location; for directions use setRoute",
  fusion_options: "leave it out: Google shut down Fusion Tables",
  view_all: "use the list view's fitAllLabel",
  view_all_text: "use the list view's fitAllLabel",
  start: "use selectedId",
  shared: "spread your defaults when mapping the data",
  commons: "spread your defaults when mapping the data",
  show_markers: "use visible: false per location",
  show_infowindows: "leave content out",
  infowindow_type: "leave content out",
  map_options: "use mapOptions (createGoogleMap's or createGoogleAdapter's) and view",
  styles: "use a map ID with Cloud styling",
  stroke_options: "use style",
  circle_options: "use style",
  directions_options: "use setRoute({ stops, travelMode, avoid })",
  directions_panel: "render each leg's steps from the routeChange event",
  draggable: "use editable per location",
  editable: "use editable per location",
  listeners: "pass your own map to createGoogleAdapter and listen on it",
  pan_on_click: "use select(id, { pan: false })",
  debug: "listen to the error event",
  visualRefresh: "leave it out: Google removed it",
};

/** Remarks for 0.2 location fields: "is a 0.2 field; <hint>". */
export const OLD_LOCATION_FIELDS = remarks("field", LOCATION_FIELDS_0_2);

/** Remarks for 0.2 names on a point (`center`, path points): only `lon` applies there. */
export const OLD_COORDINATE_FIELDS = remarks("field", { lon: LON_HINT });

/** Remarks for 0.2 options: "is a 0.2 option; <hint>". */
export const OLD_OPTIONS = remarks("option", OPTIONS_0_2);

function remarks(
  kind: string,
  hints: Readonly<Record<string, string>>,
): Readonly<Record<string, string>> {
  return Object.fromEntries(
    Object.entries(hints).map(([name, hint]) => [name, `is a 0.2 ${kind}; ${hint}`]),
  );
}
