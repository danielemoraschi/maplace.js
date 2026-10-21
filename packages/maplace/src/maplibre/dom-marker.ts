import type { Marker } from "maplibre-gl";
import { reportElementHover } from "../adapter-kit/hover-reports";
import type { Drawable } from "../drawable";
import type { LatLng } from "../geometry";
import { lngLatOf } from "./conversions";
import { selectLocation } from "./map-clicks";
import type { PlacingSite } from "./placed-location";

/** A marker showing the page's icon, in the DOM: maplace's element around the icon. */
export interface DomMarker {
  readonly marker: Marker;
  /** Shows `icon` as the only child; an icon already there stays, so its CSS transition runs. */
  showIcon(icon: Node): void;
  moveTo(at: LatLng): void;
  retitle(title: string | undefined): void;
  restack(rank: number): void;
  setVisible(visible: boolean): void;
  /** How tall it is drawn, for a popup pointing at its top. */
  height(): number;
  remove(): void;
}

/** maplace's own DOM markers' elements: a page's own markers on its map carry MapLibre's class too. */
const ownMarkers = new WeakSet<Element>();

/** Whether `target` is in one of maplace's DOM markers, which reports its own hover. */
export function isInOwnMarker(target: EventTarget | null): boolean {
  const marker = target instanceof Element ? target.closest(".maplibregl-marker") : null;
  return marker !== null && ownMarkers.has(marker);
}

/** Keys that press a focused marker, as a button. */
const PRESSING_KEYS = new Set(["Enter", " "]);

/**
 * A DOM marker at the drawable's point, its bottom middle there as Google's pin's tip: focusable,
 * named by its title, pressed by a click or a key, stacked by `rank`, reporting its input while
 * the map is live. Its click is its own: the map never sees it.
 */
export function createDomMarker(
  drawable: Drawable,
  at: LatLng,
  site: PlacingSite,
  { rank, icon }: { readonly rank: number; readonly icon: Node },
): DomMarker {
  const { map, maplibre } = site.mounted;
  const element = map.getContainer().ownerDocument.createElement("div");
  ownMarkers.add(element);
  element.tabIndex = 0;
  element.setAttribute("role", "button");
  element.style.zIndex = String(rank);
  element.append(icon);
  setTitle(element, drawable.title);
  reportInput(element, drawable.id, site);
  const marker = new maplibre.Marker({ element, anchor: "bottom" }).setLngLat(lngLatOf(at));
  let shown = false;

  function setVisible(visible: boolean): void {
    if (visible === shown) return;
    shown = visible;
    if (visible) marker.addTo(map);
    else marker.remove();
  }

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
    height: () => element.offsetHeight,
    remove: () => setVisible(false),
  };
}

function setTitle(element: HTMLElement, title: string | undefined): void {
  if (title === undefined) element.removeAttribute("aria-label");
  else element.setAttribute("aria-label", title);
}

/**
 * A press selects it; the pointer over it, or keyboard focus shown on it, hovers it. Its click
 * stops here, so the map doesn't take it for a click on the map.
 */
function reportInput(element: HTMLElement, id: string, site: PlacingSite): void {
  const { hover, mounted } = site;
  element.addEventListener("click", (event) => {
    event.stopPropagation();
    selectLocation(mounted, id);
  });
  element.addEventListener("keydown", (event) => {
    if (!PRESSING_KEYS.has(event.key)) return;
    event.preventDefault();
    selectLocation(mounted, id);
  });
  reportElementHover(element, id, hover);
}
