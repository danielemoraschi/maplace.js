import type { Map as MapLibreMap, MapOptions } from "maplibre-gl";
import { elementFilling } from "../adapter-kit/map-element";
import { MaplaceError } from "../errors";
import { MAPLIBRE_MAP_CLASS } from "./control-styles";
import type { MapLibre } from "./library";
import type { MapLibreAdapterOptions } from "./options";

/** OpenFreeMap's `liberty` style: free, no key, OpenStreetMap data. */
const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

/** A map in use, and how to give it back. */
export interface MapInUse {
  readonly map: MapLibreMap;
  release(): void;
}

/** Where the map comes from: opened in the container once maplibre-gl is loaded. */
export interface MapSource {
  open(container: HTMLElement, maplibre: MapLibre): MapInUse;
}

export function mapSourceFor(options: MapLibreAdapterOptions): MapSource {
  return options.map ? pageMapSource(options.map) : createdMapSource(options);
}

/** Until the store's first view: the world, as Google's map opens at zoom 1 (MapLibre's 0). */
const WORLD_CENTER: [number, number] = [0, 0];
const WORLD_ZOOM = 0;

/** As Google's 2D map, a map maplace creates doesn't rotate or tilt, unless `mapOptions` lets it. */
const FLAT: Partial<MapOptions> = { dragRotate: false, pitchWithRotate: false, touchPitch: false };

/** The options of a map maplace creates, in `element`. */
function createdMapOptions(
  { mapStyle, mapOptions }: MapLibreAdapterOptions,
  element: HTMLElement,
): MapOptions {
  return {
    ...FLAT,
    ...mapOptions,
    container: element,
    style: mapStyle ?? OPENFREEMAP_STYLE,
    center: WORLD_CENTER,
    zoom: WORLD_ZOOM,
  };
}

/**
 * A map maplace creates, in an element of its own filling the container: releasing removes the
 * map and that element, leaving the container as it was. MapLibre's constructor throws when the
 * browser gives it no WebGL: a load failure, and nothing stays.
 */
function createdMapSource(options: MapLibreAdapterOptions): MapSource {
  return {
    open(container, maplibre) {
      const element = elementFilling(container);
      element.classList.add(MAPLIBRE_MAP_CLASS);
      try {
        const map = new maplibre.Map(createdMapOptions(options, element));
        if (options.mapOptions?.dragRotate !== true) withoutRotation(map);
        return { map, release: () => releaseCreated(map, element) };
      } catch (cause) {
        element.remove();
        const message = "mount: MapLibre couldn't create a map (is WebGL turned off?)";
        throw new MaplaceError("provider-load-failed", message, { cause });
      }
    },
  };
}

/** A map that doesn't rotate by touch or keyboard either. */
function withoutRotation(map: MapLibreMap): void {
  map.touchZoomRotate.disableRotation();
  map.keyboard.disableRotation();
}

function releaseCreated(map: MapLibreMap, element: HTMLElement): void {
  map.remove();
  element.remove();
}

/** The page's own map: drawn on as it is, and given back as the page made it. */
function pageMapSource(map: MapLibreMap): MapSource {
  return { open: () => ({ map, release() {} }) };
}
