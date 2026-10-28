import type { Popup, PopupOptions } from "maplibre-gl";
import { POPUP_HEADING_CLASS } from "../adapter-kit/popup-content";
import {
  holdsFocus,
  type PopupView,
  type PopupWindow,
  type PopupWindowEvents,
} from "../adapter-kit/popup-window";
import type { ResolvedPopupOptions } from "../popup";
import { lngLatOf } from "./conversions";
import type { MountedMapLibre } from "./mounted-map";
import type { PopupPlace } from "./placed-location";
import { panIntoView } from "./popup-pan";

/** The map's one MapLibre popup, reused for every popup. */
export interface MapLibrePopupWindow extends PopupWindow<PopupPlace> {
  readonly popup: Popup;
}

/**
 * One MapLibre popup above the point it shows, its tip clear of what is drawn there: its heading
 * (the location's title, as Google's beside the close button) above its content. It reports its
 * content in the DOM a microtask after showing it, as Google's `domready` comes after the call, and
 * a close by its button as the user's. It stacks above every marker, as Google's does (they are in
 * the canvas container before it, a stacking context: `marker-stacking.ts`). Opened by a click,
 * it takes focus when the map held it and brings itself into view, as Google's does; a hover's
 * popup does neither.
 */
export function createPopupWindow(
  mounted: MountedMapLibre,
  events: PopupWindowEvents,
): MapLibrePopupWindow {
  const { map, maplibre, popup: settings } = mounted;
  const document = map.getContainer().ownerDocument;
  const heading = document.createElement("span");
  heading.className = POPUP_HEADING_CLASS;
  const body = document.createElement("div");
  const popup = new maplibre.Popup(popupOptions(settings));
  let closing = false;
  // Where the popup points, the DOM marker there it watches, and how far above it its tip sits.
  let pointed: PopupPlace | undefined;
  let watched: HTMLElement | undefined;
  let lift: number | undefined;
  /** Points the popup again where it points, while it watches a marker there. */
  const pointAgain = () => {
    if (watched !== undefined) pointAt(pointed as PopupPlace);
  };
  const markerResizes = new ResizeObserver(pointAgain);
  popup.on("close", () => {
    watch(undefined);
    if (!closing) events.closedByUser();
  });
  const contentShown = () => queueMicrotask(() => events.contentShown());

  /** Points the popup at `next`, and again each time the DOM marker there changes size. */
  function place(next: PopupPlace): void {
    watch("marker" in next ? next.marker : undefined);
    pointed = next;
    pointAt(next);
  }

  /**
   * Watches `marker` alone (watched again, it would be reported again, at the same size), the lift
   * kept for another marker forgotten.
   */
  function watch(marker: HTMLElement | undefined): void {
    if (marker === watched) return;
    markerResizes.disconnect();
    watched = marker;
    lift = undefined;
    if (marker !== undefined) markerResizes.observe(marker);
  }

  function pointAt(next: PopupPlace): void {
    lift = heldLift(next) ?? liftOf(next);
    const [x, y] = settings.offset;
    popup.setOffset([x, y - lift]).setLngLat(lngLatOf(next.at));
  }

  /**
   * The lift kept while the DOM marker pointed at can't be measured (`isMeasurable`): measured now,
   * it would read short, the popup dropping over it. Its images, once loaded, point the popup
   * again, as a page's image sized before it loads changes no size the observer would report.
   */
  function heldLift(next: PopupPlace): number | undefined {
    if (lift === undefined || !("marker" in next) || isMeasurable(next.marker)) return undefined;
    for (const image of next.marker.querySelectorAll("img")) {
      image.addEventListener("load", pointAgain, { once: true });
      image.addEventListener("error", pointAgain, { once: true });
    }
    return lift;
  }

  function headWith(title: string | undefined): void {
    heading.textContent = title ?? "";
    if (title === undefined) heading.remove();
    else body.prepend(heading);
    body.ariaLabel = title ?? null;
  }

  /** Only when the user acted on the map: a selection from the list or page keeps focus there. */
  const takesFocus = () => settings.openOn === "click" && holdsFocus(map.getContainer());

  return {
    popup,
    open({ element, place: at, title }: PopupView<PopupPlace>) {
      const focusing = takesFocus();
      body.replaceChildren(element);
      headWith(title);
      popup.setDOMContent(body);
      place(at);
      if (!popup.isOpen()) popup.addTo(map);
      contentShown();
      if (settings.openOn === "click") panIntoView(map, popup);
      if (focusing) focusFirstIn(popup.getElement());
    },
    refresh(element) {
      body.replaceChildren(...(heading.parentNode === body ? [heading] : []), element);
      contentShown();
    },
    retitle: headWith,
    follow: place,
    close() {
      if (!popup.isOpen()) return;
      closing = true;
      popup.remove();
      closing = false;
    },
  };
}

/** How far above its point the popup's tip sits: the height of what is drawn there. */
function liftOf(place: PopupPlace): number {
  return "marker" in place ? place.marker.offsetHeight : place.lift;
}

/**
 * Whether the marker is drawn as it will stay: on the page, every image in it loaded (an image
 * icon is a new one for each state, short until it loads).
 */
function isMeasurable(marker: HTMLElement): boolean {
  return marker.isConnected && [...marker.querySelectorAll("img")].every((image) => image.complete);
}

function popupOptions({ maxWidth }: ResolvedPopupOptions): PopupOptions {
  return {
    anchor: "bottom",
    closeButton: true,
    closeOnClick: false,
    closeOnMove: false,
    focusAfterOpen: false,
    maxWidth: maxWidth === undefined ? "none" : `${maxWidth}px`,
  };
}

const FOCUSABLE = "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])";

function focusFirstIn(element: HTMLElement | undefined): void {
  element?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
}
