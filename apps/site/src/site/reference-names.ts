import type {
  CircleLocation,
  LineStyle,
  ListViewOptions,
  Location,
  Maplace,
  MaplaceOptions,
  MarkerLocation,
  MultiPolygonLocation,
  PolygonLocation,
  PolylineLocation,
  PopupOptions,
  Route,
  ShapeStyle,
  Snapshot,
  StrokeDash,
} from "@maplacejs/maplace";

/** Each name of `Name` once: the compiler fails on a missing or an extra key. */
export function everyName<Name extends string>(
  names: { readonly [N in Name]: true },
): readonly Name[] {
  return Object.keys(names) as Name[];
}

/** The fields every location type has, as `validate/location.ts` reads them. */
type CommonField = keyof Location;

/** Every location field: those of every type, and each type's own. */
export const LOCATION_FIELDS = {
  common: everyName<CommonField>({
    id: true,
    type: true,
    title: true,
    content: true,
    html: true,
    group: true,
    searchText: true,
    tags: true,
    zoom: true,
    visible: true,
    listed: true,
    editable: true,
    data: true,
  }),
  marker: everyName<Exclude<keyof MarkerLocation, CommonField>>({
    lat: true,
    lng: true,
    icon: true,
    weight: true,
  }),
  circle: everyName<Exclude<keyof CircleLocation, CommonField>>({
    center: true,
    radius: true,
    style: true,
    selectedStyle: true,
    hoveredStyle: true,
    active: true,
    activeStyle: true,
  }),
  polyline: everyName<Exclude<keyof PolylineLocation, CommonField>>({
    path: true,
    curve: true,
    geodesic: true,
    progress: true,
    travelledStyle: true,
    style: true,
    selectedStyle: true,
    hoveredStyle: true,
    active: true,
    activeStyle: true,
  }),
  polygon: everyName<Exclude<keyof PolygonLocation, CommonField>>({
    path: true,
    holes: true,
    style: true,
    selectedStyle: true,
    hoveredStyle: true,
    active: true,
    activeStyle: true,
  }),
  multipolygon: everyName<Exclude<keyof MultiPolygonLocation, CommonField>>({
    polygons: true,
    style: true,
    selectedStyle: true,
    hoveredStyle: true,
    active: true,
    activeStyle: true,
  }),
} as const;

/** How a line's stroke can run. */
export const STROKE_DASHES = everyName<StrokeDash>({ solid: true, dashed: true, dotted: true });

/** A style's fields: a line's (`LineStyle`, with its dash) and a closed shape's (`ShapeStyle`). */
export const STYLE_FIELDS = everyName<keyof ShapeStyle | keyof LineStyle>({
  stroke: true,
  strokeOpacity: true,
  strokeWidth: true,
  strokeDash: true,
  fill: true,
  fillOpacity: true,
});

/** The store's names: its options, methods and state, and its list view's options. */
export const STORE_NAMES = {
  options: everyName<keyof MaplaceOptions>({
    locations: true,
    selectedId: true,
    sanitize: true,
    popup: true,
    style: true,
    selectedStyle: true,
    hoveredStyle: true,
    activeStyle: true,
    markerIcon: true,
    cluster: true,
    heatmap: true,
    view: true,
    skipMapLabel: true,
    selectedLabel: true,
  }),
  popupOptions: everyName<keyof PopupOptions>({
    maxWidth: true,
    offset: true,
    openOn: true,
    openInMapsLink: true,
    openInMapsLabel: true,
    directionsLink: true,
    directionsLabel: true,
  }),
  methods: everyName<keyof Maplace>({
    subscribe: true,
    getSnapshot: true,
    setLocations: true,
    select: true,
    hover: true,
    setFilter: true,
    fitAll: true,
    fitBounds: true,
    setView: true,
    setRoute: true,
    setOrigin: true,
    on: true,
    attach: true,
    whenReady: true,
    destroy: true,
  }),
  snapshot: everyName<keyof Snapshot>({
    locations: true,
    selectedId: true,
    hoveredId: true,
    filter: true,
    view: true,
    viewport: true,
    route: true,
    routeResult: true,
    origin: true,
    loadState: true,
  }),
  route: everyName<keyof Route>({
    stops: true,
    via: true,
    travelMode: true,
    avoid: true,
    style: true,
    progress: true,
    travelledStyle: true,
  }),
  listViewOptions: everyName<keyof ListViewOptions>({
    as: true,
    groupHeadings: true,
    groupCounts: true,
    fitAll: true,
    fitAllLabel: true,
    label: true,
    heading: true,
    render: true,
    scope: true,
    sort: true,
    distanceUnit: true,
    areaOnlyLabel: true,
    showAllLabel: true,
    emptyAreaLabel: true,
    search: true,
    searchLabel: true,
    noMatchesLabel: true,
    matchesLabel: true,
    groupFilter: true,
    groupFilterLabel: true,
  }),
} as const;
