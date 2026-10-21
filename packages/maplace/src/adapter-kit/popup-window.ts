import type { Drawable } from "../drawable";
import type { PopupContent } from "./popup-content";

/*
 * What a provider gives the popup session (`popup-session.ts`): where a placed location's popup
 * points, and the one popup window it draws in.
 */

/** A placed location, as its popup sees it: what it shows, and where a popup points at it. */
export interface PopupTarget<Place> {
  drawable(): Drawable;
  popupPlace(): Place;
}

/** What a provider's popup window tells the session. */
export interface PopupWindowEvents {
  /** The content set last is in the DOM: after each open or new content. */
  contentShown(): void;
  /** The user closed it with its close button; it is closed already. */
  closedByUser(): void;
}

/** One popup's view: its content's element, where it points, and its title. */
export interface PopupView<Place> {
  readonly element: HTMLElement;
  readonly place: Place;
  /** Its location's title: the popup's heading, beside the close button, and its name. */
  readonly title: string | undefined;
}

/** A provider's one popup window, reused for every popup on its map. */
export interface PopupWindow<Place> {
  open(view: PopupView<Place>): void;
  /** New content in the open window, where it is. */
  refresh(element: HTMLElement): void;
  /** A new title for the open window's heading and name, its content as it is. */
  retitle(title: string | undefined): void;
  /** Keeps up with a point that moved, as a shape's centre after an edit. */
  follow(place: Place): void;
  close(): void;
}

/** The open popup, live: `shown` turns true once its content is reported in the DOM. */
export interface SessionPopup<Window> extends PopupContent {
  readonly id: string;
  readonly window: Window;
  shown: boolean;
}

/**
 * Whether focus is inside `element` (a map's), in its document or the shadow root it sits in: a
 * popup opened by a click takes focus only then, so a selection from a list keeps focus there.
 */
export function holdsFocus(element: Element): boolean {
  const root = element.getRootNode() as Document | ShadowRoot;
  return root.activeElement !== null && element.contains(root.activeElement);
}
