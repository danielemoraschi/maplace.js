import { onTestFinished } from "vitest";
import type { MaplaceError } from "../../index";

/** A page sizing its maps with `css`, until the test finishes. */
export function styledPage(css = "maplace-map { width: 600px; height: 300px; }"): void {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.replaceChildren(style);
  onTestFinished(() => document.head.replaceChildren());
}

/** `element`'s size on the page, in whole pixels. */
export function box(element: Element | null | undefined) {
  const { width, height } = element?.getBoundingClientRect() ?? { width: 0, height: 0 };
  return { width: Math.round(width), height: Math.round(height) };
}

/** A `<div>` with these attributes, standing for the element that reads them. */
export function elementWith(attributes: Record<string, string>): HTMLElement {
  const element = document.createElement("div");
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  return element;
}

/** The errors `map` dispatches as `maplace-error`, from now on. */
export function errorsOn(map: HTMLElement): MaplaceError[] {
  const errors: MaplaceError[] = [];
  map.addEventListener("maplace-error", (event) => {
    errors.push((event as CustomEvent<{ error: MaplaceError }>).detail.error);
  });
  return errors;
}
