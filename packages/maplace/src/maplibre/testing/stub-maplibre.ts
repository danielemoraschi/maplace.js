import type { LngLatLike, Map as MapLibreMap } from "maplibre-gl";
import { vi } from "vitest";
import type { LatLng } from "../../geometry";
import type { MapLibre } from "../library";

type Listener = (event?: unknown) => void;

/** MapLibre's `Marker` as maplace uses one: an element at a point, on a map or off it. */
export class StubMarker {
  readonly element: HTMLElement;
  at: LatLng | undefined;
  map: StubMapLibreMap | undefined;

  constructor({ element }: { element: HTMLElement }) {
    this.element = element;
  }

  setLngLat(lngLat: LngLatLike): this {
    const [lng = Number.NaN, lat = Number.NaN] = lngLat as [number, number];
    this.at = { lat, lng };
    return this;
  }

  addTo(map: StubMapLibreMap): this {
    this.map = map;
    map.getCanvasContainer().append(this.element);
    return this;
  }

  remove(): this {
    this.map = undefined;
    this.element.remove();
    return this;
  }

  getElement(): HTMLElement {
    return this.element;
  }
}

/** The map's view: maplace's zoom on MapLibre's scale, and the box shown. */
interface StubView {
  zoom: number;
  south: number;
  west: number;
  north: number;
  east: number;
}

/** A MapLibre map as clustering uses one: its view, its moves and its markers' container. */
export class StubMapLibreMap {
  readonly container = document.createElement("div");
  readonly canvasContainer = document.createElement("div");
  readonly view: StubView = { zoom: 2, south: -60, west: -170, north: 60, east: 170 };
  readonly easeTo = vi.fn();
  private readonly listeners = new Map<string, Set<Listener>>();

  constructor() {
    this.container.append(this.canvasContainer);
  }

  getContainer = () => this.container;
  getCanvasContainer = () => this.canvasContainer;
  getZoom = () => this.view.zoom;
  getBounds = () => ({
    getSouth: () => this.view.south,
    getWest: () => this.view.west,
    getNorth: () => this.view.north,
    getEast: () => this.view.east,
  });

  on(type: string, listener: Listener): this {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
    return this;
  }

  off(type: string, listener: Listener): this {
    this.listeners.get(type)?.delete(listener);
    return this;
  }

  fire(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }

  listening(type: string): number {
    return this.listeners.get(type)?.size ?? 0;
  }

  /** Moves the view, as a user's move would, without firing anything. */
  moveTo(view: Partial<StubView>): void {
    Object.assign(this.view, view);
  }

  /** Its maplace and MapLibre sides, as the adapter's parts take them. */
  asMapLibre(): { map: MapLibreMap; maplibre: MapLibre } {
    return {
      map: this as unknown as MapLibreMap,
      maplibre: { Marker: StubMarker } as unknown as MapLibre,
    };
  }
}

/** The markers on `map`'s page, by their elements. */
export function markersOn(map: StubMapLibreMap): HTMLElement[] {
  return [...map.canvasContainer.children] as HTMLElement[];
}
