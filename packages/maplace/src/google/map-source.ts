/// <reference types="google.maps" preserve="true" />
import { GOOGLE_MAP_CLASS } from "./control-styles";
import { DEMO_MAP_ID, warnOfDemoMapIdOnce } from "./demo-map-id";
import type { GoogleLibraries } from "./libraries";
import { GOOGLE_COLOR_SCHEMES, type GoogleAdapterOptions } from "./options";

/** A map in use, and how to give it back. */
export interface MapInUse {
  readonly map: google.maps.Map;
  release(): void;
}

/** Where the map comes from: opened in the container once the libraries are loaded. */
export interface MapSource {
  open(container: HTMLElement, libraries: GoogleLibraries): MapInUse;
}

export function mapSourceFor(options: GoogleAdapterOptions): MapSource {
  return options.map ? pageMapSource(options.map) : createdMapSource(options);
}

// Until the store's first view: a map with no locations still shows the world, not a grey box.
const WORLD_VIEW = { center: { lat: 0, lng: 0 }, zoom: 1 };

/** The options of a map maplace creates. */
export function createdMapOptions({
  mapId,
  colorScheme,
  mapOptions,
}: GoogleAdapterOptions): google.maps.MapOptions {
  return {
    ...mapOptions,
    ...WORLD_VIEW,
    mapId: mapId ?? DEMO_MAP_ID,
    ...(colorScheme && { colorScheme: GOOGLE_COLOR_SCHEMES[colorScheme] }),
  };
}

/**
 * A map maplace creates, in an element of its own: Google writes into the element it's given and
 * has no way to unmount, so releasing removes that element and leaves the container as it was.
 */
function createdMapSource(options: GoogleAdapterOptions): MapSource {
  return {
    open(container, { maps }) {
      if (options.mapId === undefined) warnOfDemoMapIdOnce();
      return openIn(container, (element) => new maps.Map(element, createdMapOptions(options)));
    },
  };
}

/**
 * Opens a map in a new element filling the container; nothing stays if Google refuses it. The
 * element is maplace's own, so it carries the class the panels on the map stay within.
 */
function openIn(
  container: HTMLElement,
  create: (element: HTMLElement) => google.maps.Map,
): MapInUse {
  const element = elementFilling(container);
  element.classList.add(GOOGLE_MAP_CLASS);
  try {
    return { map: create(element), release: () => element.remove() };
  } catch (error) {
    element.remove();
    throw error;
  }
}

/** A new element filling the container, where a map goes. */
export function elementFilling(container: HTMLElement): HTMLElement {
  const element = container.ownerDocument.createElement("div");
  element.style.width = "100%";
  element.style.height = "100%";
  container.append(element);
  return element;
}

/** The page's own map: drawn on as it is, and given back as the page made it. */
function pageMapSource(map: google.maps.Map): MapSource {
  return { open: () => ({ map, release() {} }) };
}
