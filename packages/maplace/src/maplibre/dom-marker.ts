import type { Marker } from "maplibre-gl";
import { reportElementHover } from "../adapter-kit/hover-reports";
import type { Drawable } from "../drawable";
import type { LatLng } from "../geometry";
import { lngLatOf } from "./conversions";
import { endDragReleasedOutside } from "./drag-release";
import { selectLocation } from "./map-clicks";
import { reportMarkerDrags } from "./marker-drags";
import { PIN_SIZE, pinImageUrl } from "./pin-image";
import type { PlacingSite } from "./placed-location";

/**
 * A marker in the DOM: maplace's element around the page's icon, or around the pin while the
 * marker can be dragged.
 */
export interface DomMarker {
  readonly marker: Marker;
  /** Shows `icon` as the only child; an icon already there stays, so its CSS transition runs. */
  showIcon(icon: Node): void;
  moveTo(at: LatLng): void;
  retitle(title: string | undefined): void;
  restack(rank: number): void;
  /** Shows or hides it; one being dragged stays until let go. */
  setVisible(visible: boolean): void;
  setDraggable(draggable: boolean): void;
  /** How tall it is drawn, for a popup pointing at its top. */
  height(): number;
  /** Takes it off the map for good, at once: a drag under way ends there, reporting nothing. */
  remove(): void;
}

/** maplace's own DOM markers' elements: a page's own markers on its map carry MapLibre's class too. */
const ownMarkers = new WeakSet<Element>();

/** Counts `element`, a marker's MapLibre moves, as maplace's own: it reports its own hover. */
export function markAsOwnMarker(element: HTMLElement): void {
  ownMarkers.add(element);
}

/** Whether `target` is in one of maplace's DOM markers, which reports its own hover. */
export function isInOwnMarker(target: EventTarget | null): boolean {
  const marker = target instanceof Element ? target.closest(".maplibregl-marker") : null;
  return marker !== null && ownMarkers.has(marker);
}

/** Keys that press a focused marker or cluster, as a button. */
const PRESSING_KEYS = new Set(["Enter", " "]);

/**
 * maplace's element for something on the map a user presses, as a button: reached with Tab,
 * stacked by `rank`, pressed by a click, Enter or Space, a pointer over it as over Google's clickable
 * markers. Its click is its own: the map never sees it.
 */
export function pressableElement(
  document: Document,
  rank: number,
  press: (event: Event) => void,
): HTMLElement {
  const element = document.createElement("div");
  element.tabIndex = 0;
  element.setAttribute("role", "button");
  element.style.zIndex = String(rank);
  element.style.cursor = "pointer";
  element.addEventListener("click", (event) => {
    event.stopPropagation();
    press(event);
  });
  element.addEventListener("keydown", (event) => {
    if (!PRESSING_KEYS.has(event.key)) return;
    event.preventDefault();
    press(event);
  });
  return element;
}

/** How a DOM marker is drawn: where it stacks, what it shows, and whether a user can drag it. */
export interface DomMarkerLook {
  readonly rank: number;
  readonly icon: Node;
  readonly draggable: boolean;
}

/**
 * A DOM marker at the drawable's point, its bottom middle there as Google's pin's tip: a pressable
 * element named by its title, selecting the location when pressed, dragged while `draggable`,
 * reporting its input while the map is live.
 */
export function createDomMarker(
  drawable: Drawable,
  at: LatLng,
  site: PlacingSite,
  { rank, icon, draggable }: DomMarkerLook,
): DomMarker {
  const { mounted } = site;
  const { map, maplibre } = mounted;
  const select = () => selectLocation(mounted, drawable.id);
  const element = pressableElement(map.getContainer().ownerDocument, rank, select);
  markAsOwnMarker(element);
  element.append(icon);
  setTitle(element, drawable.title);
  const marker = new maplibre.Marker({ element, anchor: "bottom", draggable });
  marker.setLngLat(lngLatOf(at));
  showDragCursor(element, draggable);
  // The pointer over it, or keyboard focus shown on it, hovers it.
  reportElementHover(element, drawable.id, site.hover);
  const drags = reportMarkerDrags(marker, drawable.id, mounted);
  endDragReleasedOutside(marker, mounted);
  let shown = false;
  /** The visibility last asked for: a marker being dragged keeps showing until let go. */
  let asked = false;

  function setVisible(visible: boolean): void {
    asked = visible;
    if (!drags.isUnderWay()) showAsAsked();
  }

  function showAsAsked(): void {
    if (asked === shown) return;
    shown = asked;
    if (shown) marker.addTo(map);
    else marker.remove();
  }

  // After the drag's own `dragend` (registered first): its change is reported before it goes.
  marker.on("dragend", showAsAsked);

  return {
    marker,
    showIcon(next) {
      if (element.firstChild !== next || element.childNodes.length !== 1)
        element.replaceChildren(next);
    },
    moveTo: (next) => marker.setLngLat(lngLatOf(next)),
    retitle: (title) => setTitle(element, title),
    restack: (next) => {
      element.style.zIndex = String(next);
    },
    setVisible,
    setDraggable(next) {
      marker.setDraggable(next);
      showDragCursor(element, next);
    },
    height: () => element.offsetHeight,
    remove() {
      asked = false;
      shown = false;
      marker.remove();
    },
  };
}

/** MapLibre's hand over a marker a user drags (its draggable class), else the pressable's pointer. */
function showDragCursor(element: HTMLElement, draggable: boolean): void {
  element.style.cursor = draggable ? "" : "pointer";
}

function setTitle(element: HTMLElement, title: string | undefined): void {
  if (title === undefined) element.removeAttribute("aria-label");
  else element.setAttribute("aria-label", title);
}

/**
 * The default pin as an image, sized as the layer draws it, its tip at the bottom middle: a block,
 * so it sits on its point rather than on a line of text above it.
 */
export function createPinIcon(document: Document): HTMLElement {
  const image = document.createElement("img");
  image.src = pinImageUrl(document);
  image.alt = "";
  image.width = PIN_SIZE.width;
  image.height = PIN_SIZE.height;
  image.style.display = "block";
  return image;
}
