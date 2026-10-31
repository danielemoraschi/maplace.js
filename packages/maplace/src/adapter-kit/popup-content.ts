import type { Drawable } from "../drawable";
import { createPopupLinks, type PopupLinkSettings, type PopupLinks } from "./popup-links";

/** The class of a popup's content element, which the adapters' popup styles name. */
export const POPUP_CLASS = "maplace-popup";

/** The class of a popup's heading: its location's title, in the row with the close button. */
export const POPUP_HEADING_CLASS = "maplace-popup-heading";

/** A popup's content in an element of its own, the one `popupOpen` gives. */
export interface PopupContent {
  readonly element: HTMLElement;
  /** The builder it came from: a location with another one has new content. */
  readonly builtWith: Drawable["renderContent"];
  /** The links it ends in, if the map has any. */
  readonly links: PopupLinks | undefined;
}

/** None when the location has no content or its builder built nothing: no popup opens. */
export function popupContent(
  drawable: Drawable,
  document: Document,
  linkSettings: PopupLinkSettings,
): PopupContent | undefined {
  const builtWith = drawable.renderContent;
  const content = builtWith?.();
  if (content === undefined) return undefined;
  const element = document.createElement("div");
  element.className = POPUP_CLASS;
  element.append(content);
  const links = createPopupLinks(linkSettings, document, drawable.geometry);
  if (links !== undefined) element.append(links.element);
  return { element, builtWith, links };
}

/**
 * What a map does to show the popup for the location wanted, the same on every map: keep it,
 * refresh it in place with the location's new content (reported open again, never closed), or
 * replace it (close it, then open the wanted one, if any).
 */
export type PopupStep = "keep" | "refresh" | "replace";

export function popupStep(
  shown: { readonly id: string; readonly builtWith: Drawable["renderContent"] } | undefined,
  wanted: Drawable | undefined,
): PopupStep {
  if (wanted === undefined || shown?.id !== wanted.id) return "replace";
  return shown.builtWith === wanted.renderContent ? "keep" : "refresh";
}
