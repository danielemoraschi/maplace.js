import type { Drawable } from "../drawable";

/** A popup's content in an element of its own, the one `popupOpen` gives. */
export interface PopupContent {
  readonly element: HTMLElement;
  /** The builder it came from: a location with another one has new content. */
  readonly builtWith: Drawable["renderContent"];
}

/** None when the location has no content or its builder built nothing: no popup opens. */
export function popupContent(drawable: Drawable, document: Document): PopupContent | undefined {
  const builtWith = drawable.renderContent;
  const content = builtWith?.();
  if (content === undefined) return undefined;
  const element = document.createElement("div");
  element.append(content);
  return { element, builtWith };
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
