import type { ListViewOptions, MaplaceOptions } from "@maplacejs/maplace";
import type { MaplaceMapElement } from "@maplacejs/maplace/element";
import type {
  GoogleAdapterOptions,
  GoogleMapList,
  GoogleMapOptions,
} from "@maplacejs/maplace/google";
import type {
  MapLibreAdapterOptions,
  MapLibreGlobe,
  MapLibreMapList,
  MapLibreMapOptions,
} from "@maplacejs/maplace/maplibre";
import type {
  LocationListProps,
  MapControlProps,
  MaplaceEventProps,
  MaplaceMapProps,
  MaplaceProviderProps,
  MyLocationProps,
} from "@maplacejs/maplace/react";
import { everyName } from "./reference-names.ts";

// The names of the entries beyond the core: the Google and MapLibre adapters, the element and React.

export const GOOGLE_OPTIONS = everyName<keyof GoogleAdapterOptions>({
  mapId: true,
  colorScheme: true,
  map: true,
  mapOptions: true,
  apiKey: true,
  version: true,
  language: true,
  region: true,
  nonce: true,
});

/**
 * `createGoogleMap`'s own options, the store's being in its table: the adapter's it hands on, the
 * list, and the list's place (`list.position`, `list.container`) beside the list view's options.
 */
export const GOOGLE_MAP_OPTIONS = [
  ...everyName<Exclude<keyof GoogleMapOptions, keyof MaplaceOptions>>({
    mapId: true,
    colorScheme: true,
    mapOptions: true,
    apiKey: true,
    version: true,
    language: true,
    region: true,
    nonce: true,
    list: true,
    myLocation: true,
  }),
  ...everyName<Exclude<keyof GoogleMapList, keyof ListViewOptions>>({
    position: true,
    container: true,
  }).map((name) => `list.${name}`),
  "myLocation.position",
];

const GLOBE_OPTIONS = everyName<keyof MapLibreGlobe>({ position: true, label: true }).map(
  (name) => `globe.${name}`,
);

export const MAPLIBRE_OPTIONS = [
  ...everyName<keyof MapLibreAdapterOptions>({
    mapStyle: true,
    map: true,
    mapOptions: true,
    globe: true,
  }),
  ...GLOBE_OPTIONS,
];

/** `createMapLibreMap`'s own options, as `GOOGLE_MAP_OPTIONS` lists `createGoogleMap`'s. */
export const MAPLIBRE_MAP_OPTIONS = [
  ...everyName<Exclude<keyof MapLibreMapOptions, keyof MaplaceOptions>>({
    mapStyle: true,
    mapOptions: true,
    globe: true,
    list: true,
    myLocation: true,
  }),
  ...everyName<Exclude<keyof MapLibreMapList, keyof ListViewOptions>>({
    position: true,
    container: true,
  }).map((name) => `list.${name}`),
  "myLocation.position",
  ...GLOBE_OPTIONS,
];

/** What `<maplace-map>` adds to an HTML element. */
export const MAP_ELEMENT_PROPERTIES = everyName<
  Exclude<keyof MaplaceMapElement, keyof HTMLElement>
>({
  locations: true,
  route: true,
  sanitize: true,
  maplace: true,
  loadState: true,
  release: true,
});

/** Each React component's props; the provider's event props are derived from the events. */
export const REACT_PROPS = {
  provider: everyName<Exclude<keyof MaplaceProviderProps, keyof MaplaceEventProps>>({
    locations: true,
    defaultSelectedId: true,
    children: true,
    selectedId: true,
    filter: true,
    route: true,
    sanitize: true,
    popup: true,
    style: true,
    selectedStyle: true,
    hoveredStyle: true,
    cluster: true,
    view: true,
    skipMapLabel: true,
    selectedLabel: true,
  }),
  map: everyName<keyof MaplaceMapProps>({
    createAdapter: true,
    className: true,
    children: true,
    popupContent: true,
    markerIcon: true,
  }),
  list: everyName<keyof LocationListProps>({
    as: true,
    groupHeadings: true,
    groupCounts: true,
    fitAll: true,
    fitAllLabel: true,
    label: true,
    heading: true,
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
    children: true,
    position: true,
  }),
  control: everyName<keyof MapControlProps>({ position: true, children: true }),
  myLocation: everyName<keyof MyLocationProps>({
    position: true,
    label: true,
    unavailableLabel: true,
  }),
} as const;
