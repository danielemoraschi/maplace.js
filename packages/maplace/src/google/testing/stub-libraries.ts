/// <reference types="google.maps" />
import { vi } from "vitest";
import type { GoogleLibraries } from "../libraries";
import { StubMVCObject } from "./stub-mvc";
import { StubInfoWindow, StubSize } from "./stub-popups";
import { StubCircle, StubPolygon, StubPolyline } from "./stub-shapes";

/** A Google map as far as the adapter uses one: its element, its options and its listeners. */
export class StubMap extends StubMVCObject {
  constructor(
    readonly element: HTMLElement,
    readonly options: google.maps.MapOptions = {},
  ) {
    super();
  }

  getDiv(): HTMLElement {
    return this.element;
  }
}

/** An advanced marker: an element holding the properties the adapter sets. */
export class StubMarker extends HTMLElement {
  position: google.maps.LatLngLiteral | null = null;
  zIndex: number | null = null;
  gmpClickable = false;
  gmpDraggable = false;
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
    core: { Size: StubSize },
    maps: {
      Map: StubMap,
      Circle: StubCircle,
      Polyline: StubPolyline,
      Polygon: StubPolygon,
      InfoWindow: StubInfoWindow,
    },
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
