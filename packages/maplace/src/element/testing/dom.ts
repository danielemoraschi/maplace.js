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

/** The events of `type` dispatched on `target` (or bubbling to it), from now until the test ends. */
export function eventsOn(target: EventTarget, type: string): CustomEvent[] {
  const events: CustomEvent[] = [];
  listenDuringTest(target, type, (event) => events.push(event));
  return events;
}

/** The errors dispatched on `target` (or bubbling to it) as `maplace-error`, until the test ends. */
export function errorsOn(target: EventTarget): MaplaceError[] {
  const errors: MaplaceError[] = [];
  listenDuringTest(target, "maplace-error", (event) => errors.push(event.detail.error));
  return errors;
}

/** A listener removed when the test finishes, so no test hears another's events. */
function listenDuringTest(
  target: EventTarget,
  type: string,
  listener: (event: CustomEvent) => void,
): void {
  const heard = (event: Event) => listener(event as CustomEvent);
  target.addEventListener(type, heard);
  onTestFinished(() => target.removeEventListener(type, heard));
}
