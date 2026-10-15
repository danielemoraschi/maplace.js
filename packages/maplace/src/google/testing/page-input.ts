import { expect } from "vitest";
import { userEvent } from "vitest/browser";
import type { ViewportPoint } from "./mouse-commands";

/** The middle of an element on the page, where a user points at it. */
export function centreOf(element: Element): ViewportPoint {
  const box = element.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}

/** Tabs through the page until `element` has keyboard focus. */
export async function tabTo(element: HTMLElement): Promise<void> {
  for (let presses = 0; presses < 50 && document.activeElement !== element; presses++) {
    await userEvent.keyboard("{Tab}");
  }
  expect(document.activeElement).toBe(element);
}
