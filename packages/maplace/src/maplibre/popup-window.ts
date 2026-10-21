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
  popup.on("close", () => {
    if (!closing) events.closedByUser();
  });
  const contentShown = () => queueMicrotask(() => events.contentShown());

  function place({ at, lift }: PopupPlace): void {
    const [x, y] = settings.offset;
    popup.setOffset([x, y - lift]).setLngLat(lngLatOf(at));
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
