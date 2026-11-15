/// <reference types="google.maps" preserve="true" />

import { POINTER_THROUGH_ATTRIBUTE } from "../adapter-kit/pointer-through";
import { POPUP_HEADING_CLASS } from "../adapter-kit/popup-content";
import { holdsFocus, type PopupWindow, type PopupWindowEvents } from "../adapter-kit/popup-window";
import type { MountedMap } from "./mounted-map";
import type { PopupPlace } from "./placed-location";
import { type Gutter, gutterOf, withGutter } from "./popup-gutter";
import { createPopupPan } from "./popup-pan";
import { layerPopupPane } from "./popup-pane";
import { GOOGLE_POPUP_ATTRIBUTE } from "./popup-styles";

/** The map's one Google InfoWindow, reused for every popup. */
export interface GooglePopupWindow extends PopupWindow<PopupPlace> {
  readonly infoWindow: google.maps.InfoWindow;
}

/**
 * One Google InfoWindow per map, reused: one opened by a click pans clear of the map's corners once
 * the map settles (popup-pan.ts); a hover's never moves the camera. Its pane is layered for as long
 * as the map is open (`popup-pane.ts`), and its box there is the one the pointer goes through.
 */
export function createPopupWindow(
  mounted: MountedMap,
  events: PopupWindowEvents,
): GooglePopupWindow {
  const { maps, core } = mounted.libraries;
  const { maxWidth, offset, openOn } = mounted.popup;
  const mapDiv = mounted.map.getDiv();
  const infoWindow = new maps.InfoWindow({
    maxWidth: maxWidth ?? null,
    pixelOffset: new core.Size(offset[0], offset[1]),
    // A hover popup follows the pointer, and the list's keyboard focus: it never moves the camera.
    disableAutoPan: openOn === "hover",
  });
  let shown: HTMLElement | undefined;
  let heading: HTMLElement | undefined;
  // The last gutter measured, given to new content and headings until Google shows them, so their
  // insets don't jump.
  let gutter: Gutter | undefined;
  let pane: HTMLElement | undefined;
  let through = false;
  mounted.onDestroy(
    layerPopupPane(mounted.map, maps, (found) => {
      pane = found;
    }),
  );
  /** Marked on the window's own box in the pane, once Google shows it there, and on each change. */
  const markThrough = () => {
    const content = shown;
    const box = content && pane && [...pane.children].find((child) => child.contains(content));
    box?.toggleAttribute(POINTER_THROUGH_ATTRIBUTE, through);
  };
  infoWindow.addListener("domready", () => {
    const scrollBox = shown?.parentElement;
    if (scrollBox) gutter = gutterOf(scrollBox);
    for (const element of [shown, heading]) if (element) withGutter(element, gutter);
    markThrough();
    events.contentShown();
  });
  /** `element` marked as Google's, with the last gutter measured. */
  const fitted = (element: HTMLElement) => withGutter(markedAsGoogles(element), gutter);
  const nowShown = (element: HTMLElement) => {
    shown = fitted(element);
    return shown;
  };
  const pan = createPopupPan(mounted.map, infoWindow);
  infoWindow.addListener("closeclick", () => {
    pan.stop();
    events.closedByUser();
  });

  function follow(place: PopupPlace): void {
    if ("position" in place) infoWindow.setPosition(place.position);
  }

  /** The window headed and named by `title`, as text beside the close button; bare without one. */
  function headed(title: string | undefined): google.maps.InfoWindowOptions {
    heading = undefined;
    if (title === undefined) return { headerContent: null, ariaLabel: null };
    heading = fitted(mapDiv.ownerDocument.createElement("span"));
    heading.className = POPUP_HEADING_CLASS;
    heading.textContent = title;
    return { headerContent: heading, ariaLabel: title };
  }

  /** Only when the user acted on the map: a selection from the list or page keeps focus there. */
  const takesFocus = () => openOn === "click" && holdsFocus(mapDiv);

  return {
    infoWindow,
    open({ element, place, title }) {
      if (openOn === "click") pan.panWhenSettled();
      infoWindow.setOptions({ content: nowShown(element), ...headed(title) });
      follow(place);
      const anchor = "anchor" in place ? place.anchor : null;
      infoWindow.open({ map: mounted.map, anchor, shouldFocus: takesFocus() });
    },
    refresh: (element) => infoWindow.setContent(nowShown(element)),
    retitle: (title) => infoWindow.setOptions(headed(title)),
    follow,
    passPointer(next) {
      through = next;
      markThrough();
    },
    close() {
      pan.stop();
      infoWindow.close();
    },
  };
}

/** `element` marked as Google's popup content or heading, which Google's popup rules alone reach. */
function markedAsGoogles(element: HTMLElement): HTMLElement {
  element.setAttribute(GOOGLE_POPUP_ATTRIBUTE, "");
  return element;
}
