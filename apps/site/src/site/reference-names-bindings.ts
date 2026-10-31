import type { ListViewOptions, MaplaceOptions } from "maplace";
import type { MaplaceMapElement } from "maplace/element";
import type { GoogleAdapterOptions, GoogleMapList, GoogleMapOptions } from "maplace/google";
import type { MapLibreAdapterOptions, MapLibreMapList, MapLibreMapOptions } from "maplace/maplibre";
import type {
  LocationListProps,
  MapControlProps,
  MaplaceEventProps,
  MaplaceMapProps,
  MaplaceProviderProps,
} from "maplace/react";
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
  }),
  ...everyName<Exclude<keyof GoogleMapList, keyof ListViewOptions>>({
    position: true,
    container: true,
  }).map((name) => `list.${name}`),
];

export const MAPLIBRE_OPTIONS = everyName<keyof MapLibreAdapterOptions>({
  mapStyle: true,
  map: true,
  mapOptions: true,
});

/** `createMapLibreMap`'s own options, as `GOOGLE_MAP_OPTIONS` lists `createGoogleMap`'s. */
export const MAPLIBRE_MAP_OPTIONS = [
  ...everyName<Exclude<keyof MapLibreMapOptions, keyof MaplaceOptions>>({
    mapStyle: true,
    mapOptions: true,
    list: true,
  }),
  ...everyName<Exclude<keyof MapLibreMapList, keyof ListViewOptions>>({
    position: true,
    container: true,
  }).map((name) => `list.${name}`),
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
    fitAllLabel: true,
    label: true,
    heading: true,
    scope: true,
    areaOnlyLabel: true,
    showAllLabel: true,
    emptyAreaLabel: true,
    searchLabel: true,
    noMatchesLabel: true,
    matchesLabel: true,
    children: true,
    position: true,
  }),
  control: everyName<keyof MapControlProps>({ position: true, children: true }),
} as const;
