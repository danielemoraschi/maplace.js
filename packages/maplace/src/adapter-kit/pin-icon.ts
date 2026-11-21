import { adoptStyles } from "../adopted-styles";
import { pinImageSize, pinImageUrl } from "./pin-image";
import type { PinLook } from "./pin-looks";

/** The class of a pin's image in the DOM. */
export const PIN_CLASS = "maplace-pin";

/** A block, so no line of text sits under it: what maplace's own markup needs, never unstyled. */
const PIN_STYLES = `.${PIN_CLASS}{display:block}`;

/** maplace's pins in the DOM. */
const pinIcons = new WeakSet<Node>();

/** Each of maplace's pins in the DOM by the look it was last drawn in. */
const shownLooks = new WeakMap<Node, PinLook>();

/** What of a marker meets its point: maplace's pin its middle, a page's icon its bottom. */
export type IconAnchor = "bottom" | "center";

/** Whether `node` is maplace's pin rather than a page's icon. */
export function isPinIcon(node: Node | undefined): boolean {
  return node !== undefined && pinIcons.has(node);
}

/** What of a marker showing `icon` meets its point. */
export function anchorFor(icon: Node): IconAnchor {
  return isPinIcon(icon) ? "center" : "bottom";
}

/**
 * `pin` showing the default pin in `look`, its dot in its middle: a new image when none is given,
 * the same one repainted otherwise, so a drag in progress keeps hold of it. Only a new look
 * touches it, so painting a pin as it was costs a lookup.
 */
export function paintPin(
  document: Document,
  look: PinLook,
  pin?: HTMLImageElement,
): HTMLImageElement {
  const image = pin ?? newPinImage(document);
  if (shownLooks.get(image) === look) return image;
  const url = pinImageUrl(document, look);
  // A look not drawn (no 2D context) is tried again at the next paint.
  if (url !== "") shownLooks.set(image, look);
  image.src = url;
  image.width = image.height = pinImageSize(look);
  return image;
}

function newPinImage(document: Document): HTMLImageElement {
  adoptStyles(document, PIN_STYLES);
  const image = document.createElement("img");
  image.className = PIN_CLASS;
  image.alt = "";
  // A press on it drags the map or the marker, never a copy of the picture.
  image.draggable = false;
  pinIcons.add(image);
  return image;
}
