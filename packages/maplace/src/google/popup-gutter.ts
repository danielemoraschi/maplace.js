import { BLOCK_GUTTER_PROPERTY, INLINE_GUTTER_PROPERTY } from "./popup-styles";

/** The room a scroll box keeps beside its client area, in px: at its inline end and below it. */
export interface Gutter {
  readonly inlineEnd: number;
  readonly blockEnd: number;
}

/**
 * The room `box`, Google's scroll box around a popup's content, keeps for its scrollbars: none at
 * the inline end where the scrollbar sits at the inline start instead (Safari's, on a right-to-left
 * page), as the insets assume the end.
 */
export function gutterOf(box: HTMLElement): Gutter {
  const inlineEnd =
    getComputedStyle(box).direction === "rtl"
      ? box.clientLeft
      : box.offsetWidth - box.clientWidth - box.clientLeft;
  return { inlineEnd, blockEnd: box.offsetHeight - box.clientHeight - box.clientTop };
}

/** `element` given `gutter`, once one is measured, as the properties Google's popup rules inset by. */
export function withGutter(element: HTMLElement, gutter: Gutter | undefined): HTMLElement {
  if (gutter === undefined) return element;
  element.style.setProperty(INLINE_GUTTER_PROPERTY, `${gutter.inlineEnd}px`);
  element.style.setProperty(BLOCK_GUTTER_PROPERTY, `${gutter.blockEnd}px`);
  return element;
}
