/// <reference types="google.maps" />
import { StubMVCObject } from "./stub-mvc";

export class StubSize {
  constructor(
    readonly width: number,
    readonly height: number,
  ) {}
}

/** The panes Google gives an overlay, as far as the adapter reads them. */
interface StubPanes {
  readonly floatPane: HTMLElement;
  readonly overlayLayer?: HTMLElement | undefined;
}

/** A map an overlay is set on, as the stub reads it: its panes, centre and zoom. */
interface StubOverlayMap extends StubPanes {
  getZoom?(): number | undefined;
}

/**
 * Google's projection into an overlay's panes, as a test can follow it: a world 256 pixels wide
 * at zoom 0, twice as wide at each zoom above, with no curve (latitude maps straight to y).
 */
export class StubProjection {
  constructor(readonly zoom: number) {}

  getWorldWidth(): number {
    return 256 * 2 ** this.zoom;
  }

  fromLatLngToDivPixel(at: google.maps.LatLng | google.maps.LatLngLiteral) {
    const { lat, lng } = "toJSON" in at ? at.toJSON() : at;
    const world = this.getWorldWidth();
    return { x: ((lng + 180) / 360) * world, y: ((90 - lat) / 180) * world };
  }
}

/**
 * Google's OverlayView as far as the adapter uses one: set on a map, it is given the map's panes
 * and added (`onAdd`); set on none after that, removed (`onRemove`).
 */
export class StubOverlayView {
  onAdd(): void {
    // What the overlay does once added: its user's, set on the instance, as Google's is.
  }

  onRemove(): void {
    // What the overlay does once removed: its user's too.
  }

  draw(): void {
    // What the overlay draws at each change of the view: its user's, as Google's is.
  }

  #panes: StubPanes | null = null;
  #map: StubOverlayMap | null = null;

  getPanes(): StubPanes | null {
    return this.#panes;
  }

  /** The projection at the map's zoom while the overlay is on one. */
  getProjection(): StubProjection | null {
    return this.#map === null ? null : new StubProjection(this.#map.getZoom?.() ?? 0);
  }

  /** `map` a stub map, which holds the panes; added, the overlay draws once, as Google's does. */
  setMap(map: StubOverlayMap | null): void {
    if (this.#panes !== null) {
      this.onRemove();
      this.#panes = null;
      this.#map = null;
    }
    if (map === null) return;
    this.#panes = { floatPane: map.floatPane, overlayLayer: map.overlayLayer };
    this.#map = map;
    this.onAdd();
    this.draw();
  }
}

/**
 * Google's InfoWindow as far as the adapter uses one: while open its heading and content are in a
 * box in its map's popup pane while that is on the page (a test puts it there), else in the
 * page's body, `domready` follows each open or new content in a microtask, and every close
 * fires `close`.
 */
export class StubInfoWindow extends StubMVCObject {
  readonly box = document.createElement("div");
  /** What each `open` was given, in order. */
  readonly opens: google.maps.InfoWindowOpenOptions[] = [];
  #open = false;

  constructor(options: object = {}) {
    super();
    this.setValues(options);
  }

  get isOpen(): boolean {
    return this.#open;
  }

  setOptions(options: object): void {
    this.setValues(options);
    if ("content" in options || "headerContent" in options) this.#draw();
    if ("content" in options && this.#open) this.#ready();
  }

  setContent(content: Node): void {
    this.setOptions({ content });
  }

  getContent(): unknown {
    return this.get("content");
  }

  setPosition(position: unknown): void {
    this.set("position", position);
  }

  open(options: google.maps.InfoWindowOpenOptions): void {
    if (this.#open) this.trigger("close");
    this.opens.push(options);
    this.#open = true;
    const pane = (options.map as unknown as Partial<StubPanes> | null | undefined)?.floatPane;
    (pane?.isConnected ? pane : document.body).append(this.box);
    this.#ready();
  }

  close(): void {
    if (!this.#open) return;
    this.#open = false;
    this.box.remove();
    this.trigger("close");
  }

  /** A click on the close button: Google closes the window, then says the user did. */
  closeByUser(): void {
    this.close();
    this.trigger("closeclick");
  }

  /** The heading Google draws beside its close button, then the content. */
  #draw(): void {
    const parts = [this.get("headerContent"), this.get("content")] as (Node | null | undefined)[];
    this.box.replaceChildren(...parts.filter((part): part is Node => part != null));
  }

  #ready(): void {
    queueMicrotask(() => {
      if (this.#open) this.trigger("domready");
    });
  }
}
