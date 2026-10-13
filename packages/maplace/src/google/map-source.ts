/// <reference types="google.maps" />
import { loadLibrary } from "./libraries";
import { GOOGLE_COLOR_SCHEMES, type GoogleAdapterOptions } from "./options";

/** A map in use, and how to give it back. */
export interface MapInUse {
  readonly map: google.maps.Map;
  release(): void;
}

/** Where the map comes from: loaded first, then opened in the container at once. */
export interface MapSource {
  load(): Promise<(container: HTMLElement) => MapInUse>;
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
    mapId,
    ...(colorScheme && { colorScheme: GOOGLE_COLOR_SCHEMES[colorScheme] }),
  };
}

/**
 * A map maplace creates, in an element of its own: Google writes into the element it's given and
 * has no way to unmount, so releasing removes that element and leaves the container as it was.
 */
function createdMapSource(options: GoogleAdapterOptions): MapSource {
  return {
    async load() {
      const { Map: GoogleMap } = await loadLibrary("maps");
      return (container) =>
        openIn(container, (element) => new GoogleMap(element, createdMapOptions(options)));
    },
  };
}

/** Opens a map in a new element filling the container; nothing stays if Google refuses it. */
function openIn(
  container: HTMLElement,
  create: (element: HTMLElement) => google.maps.Map,
): MapInUse {
  const element = container.ownerDocument.createElement("div");
  element.style.width = "100%";
  element.style.height = "100%";
  container.append(element);
  try {
    return { map: create(element), release: () => element.remove() };
  } catch (error) {
    element.remove();
    throw error;
  }
}

/** The page's own map: drawn on as it is, and given back as the page made it. */
function pageMapSource(map: google.maps.Map): MapSource {
  return {
    load: async () => () => ({ map, release() {} }),
  };
}
