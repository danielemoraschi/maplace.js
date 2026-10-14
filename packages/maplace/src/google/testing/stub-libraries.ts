/// <reference types="google.maps" />
import { vi } from "vitest";
import type { GoogleLibraries } from "../libraries";

type Handler = (event: unknown) => void;

/** A Google map as far as the adapter uses one: its element, its options and its listeners. */
export class StubMap {
  readonly #listeners = new Map<string, Set<Handler>>();

  constructor(
    readonly element: HTMLElement,
    readonly options: google.maps.MapOptions = {},
  ) {}

  getDiv(): HTMLElement {
    return this.element;
  }

  addListener(name: string, handler: Handler): google.maps.MapsEventListener {
    const handlers = this.#listeners.get(name) ?? new Set();
    this.#listeners.set(name, handlers.add(handler));
    return { remove: () => handlers.delete(handler) };
  }

  /** Fires `name` as Google would, with an event like Google's. */
  trigger(name: string, event: unknown = {}): void {
    for (const handler of this.#listeners.get(name) ?? []) handler(event);
  }
}

/** An advanced marker: an element holding the properties the adapter sets. */
export class StubMarker extends HTMLElement {
  position: google.maps.LatLngLiteral | null = null;
  zIndex: number | null = null;
  gmpClickable = false;
  map: unknown = null;

  constructor(options: google.maps.marker.AdvancedMarkerElementOptions = {}) {
    super();
    Object.assign(this, options);
  }
}

customElements.define("stub-advanced-marker", StubMarker);

/** The libraries as the adapter loads them, made of the stubs above. */
export function stubLibraries(): GoogleLibraries {
  return {
    maps: { Map: StubMap },
    marker: { AdvancedMarkerElement: StubMarker },
  } as unknown as GoogleLibraries;
}

/** Puts a Maps JS on the page whose `importLibrary` waits for `loaded`, then gives the stubs. */
export function stubMapsJs(loaded: Promise<void> = Promise.resolve()): GoogleLibraries {
  const libraries = stubLibraries();
  const importLibrary = async (name: keyof GoogleLibraries) => {
    await loaded;
    return libraries[name];
  };
  vi.stubGlobal("google", { maps: { importLibrary } });
  return libraries;
}
