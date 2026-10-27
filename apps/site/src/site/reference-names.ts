import type {
  CircleLocation,
  ListViewOptions,
  Maplace,
  MaplaceOptions,
  MarkerLocation,
  PolygonLocation,
  PolylineLocation,
  PopupOptions,
  Route,
  ShapeStyle,
  Snapshot,
} from "maplace";

/** Each name of `Name` once: the compiler fails on a missing or an extra key. */
export function everyName<Name extends string>(
  names: { readonly [N in Name]: true },
): readonly Name[] {
  return Object.keys(names) as Name[];
}

/** The fields every location type has, as `validate/location.ts` reads them. */
type CommonField = keyof MarkerLocation &
  keyof CircleLocation &
  keyof PolylineLocation &
  keyof PolygonLocation;

/** Every location field: those of every type, and each type's own. */
export const LOCATION_FIELDS = {
  common: everyName<CommonField>({
    id: true,
    type: true,
    title: true,
    content: true,
    html: true,
    group: true,
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
  }),
  circle: everyName<Exclude<keyof CircleLocation, CommonField>>({
    center: true,
    radius: true,
    style: true,
    selectedStyle: true,
    hoveredStyle: true,
  }),
  polyline: everyName<Exclude<keyof PolylineLocation, CommonField>>({
    path: true,
    style: true,
    selectedStyle: true,
    hoveredStyle: true,
  }),
  polygon: everyName<Exclude<keyof PolygonLocation, CommonField>>({
    path: true,
    holes: true,
    style: true,
    selectedStyle: true,
    hoveredStyle: true,
  }),
} as const;

export const SHAPE_STYLE_FIELDS = everyName<keyof ShapeStyle>({
  stroke: true,
  strokeOpacity: true,
  strokeWidth: true,
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
    cluster: true,
    view: true,
  }),
  popupOptions: everyName<keyof PopupOptions>({ maxWidth: true, offset: true, openOn: true }),
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
    loadState: true,
  }),
  route: everyName<keyof Route>({
    stops: true,
    via: true,
    travelMode: true,
    avoid: true,
    style: true,
  }),
  listViewOptions: everyName<keyof ListViewOptions>({
    as: true,
    groupHeadings: true,
    fitAllLabel: true,
    label: true,
    heading: true,
    render: true,
    scope: true,
    areaOnlyLabel: true,
    showAllLabel: true,
    emptyAreaLabel: true,
  }),
} as const;
