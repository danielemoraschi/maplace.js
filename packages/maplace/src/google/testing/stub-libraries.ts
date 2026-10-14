/// <reference types="google.maps" />
import { vi } from "vitest";
import type { GoogleLibraries } from "../libraries";
import { StubMVCArray, StubMVCObject } from "./stub-mvc";
import { StubInfoWindow, StubSize } from "./stub-popups";
import { StubCircle, StubPolygon, StubPolyline } from "./stub-shapes";

/** What a drawn Google map shows, as the stub gives it back. */
export interface StubView {
  readonly center: google.maps.LatLngLiteral;
  readonly zoom: number;
  readonly bounds: google.maps.LatLngBoundsLiteral;
}

/**
 * A Google map as far as the adapter uses one: its element, its options, its listeners, the
 * camera moves asked of it, and what it shows (nothing until a test says, as before Google draws).
 */
export class StubMap extends StubMVCObject {
  readonly moveCamera = vi.fn();
  readonly panTo = vi.fn();
  readonly fitBounds = vi.fn();
  /** Google's control corners, one array per `ControlPosition` value (up to 24 in Maps JS 3.66). */
  readonly controls = Array.from({ length: 25 }, () => new StubMVCArray<HTMLElement>());
  shown: StubView | undefined;
  /** Drawn already, as a map Google has initialised; `UNINITIALIZED` until Google has said more. */
  renderingType = "RASTER";
  /** What Google says the map can show; it reads `true` until Google knows, as Google's does. */
  capabilities: google.maps.MapCapabilities = { isAdvancedMarkersAvailable: true };

  constructor(
    readonly element: HTMLElement,
    readonly options: google.maps.MapOptions = {},
  ) {
    super();
  }

  getDiv(): HTMLElement {
    return this.element;
  }

  getRenderingType(): string {
    return this.renderingType;
  }

  getMapCapabilities(): google.maps.MapCapabilities {
    return this.capabilities;
  }

  /** The user's input on the map: a press by default, or another input's type. */
  userInput(type = "pointerdown"): void {
    this.element.dispatchEvent(new Event(type));
  }

  /** Google initialising the map, and with it saying what it can show. */
  initialise(capabilities: google.maps.MapCapabilities): void {
    this.capabilities = capabilities;
    this.renderingType = "RASTER";
    this.trigger("renderingtype_changed");
  }

  getCenter() {
    const center = this.shown?.center;
    return center && { toJSON: () => center };
  }

  getZoom(): number | undefined {
    return this.shown?.zoom;
  }

  getBounds() {
    const bounds = this.shown?.bounds;
    return bounds && { toJSON: () => bounds };
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

/** Google's `ControlPosition` values for the corners (Maps JS 3.66). */
export const STUB_CONTROL_POSITIONS = {
  TOP_LEFT: 1,
  TOP_RIGHT: 3,
  BOTTOM_LEFT: 10,
  BOTTOM_RIGHT: 12,
} as const;

/** Google's `RenderingType` values (Maps JS 3.66). */
const STUB_RENDERING_TYPES = { UNINITIALIZED: "UNINITIALIZED", RASTER: "RASTER", VECTOR: "VECTOR" };

/** The libraries as the adapter loads them, made of the stubs above. */
export function stubLibraries(): GoogleLibraries {
  return {
    core: { Size: StubSize, ControlPosition: STUB_CONTROL_POSITIONS },
    maps: {
      Map: StubMap,
      Circle: StubCircle,
      Polyline: StubPolyline,
      Polygon: StubPolygon,
      InfoWindow: StubInfoWindow,
      RenderingType: STUB_RENDERING_TYPES,
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
