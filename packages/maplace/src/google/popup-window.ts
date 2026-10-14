/// <reference types="google.maps" />
import type { MountedMap } from "./mounted-map";
import type { PopupPlace } from "./placed-location";

/** What the window tells whoever opened it. */
export interface PopupWindowEvents {
  /** The content set last is in the DOM: Google's `domready`, after each open or new content. */
  contentShown(): void;
  /** The user closed it with its close button; Google has closed it already. */
  closedByUser(): void;
}

/** One popup's view: its content's element, where it points, and its accessible name. */
export interface PopupView {
  readonly element: HTMLElement;
  readonly place: PopupPlace;
  readonly title: string | undefined;
}

/** The map's one Google InfoWindow, reused for every popup. */
export interface PopupWindow {
  readonly infoWindow: google.maps.InfoWindow;
  open(view: PopupView): void;
  /** New content in the open window, where it is. */
  refresh(element: HTMLElement): void;
  /** Keeps up with a point that moved, as a shape's centre after an edit; anchors follow by themselves. */
  follow(place: PopupPlace): void;
  close(): void;
}

export function createPopupWindow(mounted: MountedMap, events: PopupWindowEvents): PopupWindow {
  const { maps, core } = mounted.libraries;
  const { maxWidth, offset, openOn } = mounted.popup;
  const infoWindow = new maps.InfoWindow({
    maxWidth: maxWidth ?? null,
    pixelOffset: new core.Size(offset[0], offset[1]),
    // A hover popup follows the pointer, and the list's keyboard focus: it never moves the camera.
    disableAutoPan: openOn === "hover",
  });
  infoWindow.addListener("domready", () => events.contentShown());
  infoWindow.addListener("closeclick", () => events.closedByUser());

  function follow(place: PopupPlace): void {
    if ("position" in place) infoWindow.setPosition(place.position);
  }

  /** Only when the user acted on the map: a selection from the list or the page keeps focus there. */
  const takesFocus = () => openOn === "click" && holdsFocus(mounted.map.getDiv());

  return {
    infoWindow,
    open({ element, place, title }) {
      infoWindow.setOptions({ content: element, ariaLabel: title ?? null });
      follow(place);
      const anchor = "anchor" in place ? place.anchor : null;
      infoWindow.open({ map: mounted.map, anchor, shouldFocus: takesFocus() });
    },
    refresh: (element) => infoWindow.setContent(element),
    follow,
    close: () => infoWindow.close(),
  };
}

/** Whether focus is inside `element`, in its document or in the shadow root it sits in. */
function holdsFocus(element: Element): boolean {
  const root = element.getRootNode() as Document | ShadowRoot;
  return root.activeElement !== null && element.contains(root.activeElement);
}
