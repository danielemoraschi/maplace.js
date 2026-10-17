import { expect, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { frames } from "../frames";
import type { ViewportPoint } from "./mouse-commands";
import { TILES_TIMEOUT_MS } from "./store-on-google";

/** The middle of an element on the page, where a user points at it. */
export function centreOf(element: Element): ViewportPoint {
  return middleOf(element.getBoundingClientRect());
}

/**
 * The middle of the element `find` gives, once a user can press it there: on screen, holding
 * still for a frame, and on top at that point. Under load a map's markers still move after they
 * are first drawn (the map settling its first view), and a press that lands as they move is no
 * click. `find` runs at each try, so an element a re-render replaced is never the one pressed.
 */
export function steadyPoint(find: () => Element | undefined): Promise<ViewportPoint> {
  return vi.waitUntil(() => stillPointOf(find()), { timeout: TILES_TIMEOUT_MS });
}

/** `element`'s middle when it held still for a frame and is what a press there hits. */
async function stillPointOf(element: Element | undefined): Promise<ViewportPoint | undefined> {
  if (element === undefined) return undefined;
  element.scrollIntoView({ block: "nearest" });
  const before = element.getBoundingClientRect();
  await frames(1);
  const after = element.getBoundingClientRect();
  const point = middleOf(after);
  const still = after.width > 0 && sameBox(before, after);
  return still && isHitAt(element, point) ? point : undefined;
}

function middleOf(box: DOMRect): ViewportPoint {
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}

function sameBox(a: DOMRect, b: DOMRect): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

/** Whether a press at `point` reaches `element`: it, or something inside it, is on top there. */
function isHitAt(element: Element, { x, y }: ViewportPoint): boolean {
  const hit = element.ownerDocument.elementFromPoint(x, y);
  return hit !== null && element.contains(hit);
}

/** Tabs through the page until `element` has keyboard focus. */
export async function tabTo(element: HTMLElement): Promise<void> {
  for (let presses = 0; presses < 50 && document.activeElement !== element; presses++) {
    await userEvent.keyboard("{Tab}");
  }
  expect(document.activeElement).toBe(element);
}
