import type { Roving } from "./roving";

/** Where focus was before a re-render, if the list held it. */
export interface HeldFocus {
  readonly element: HTMLElement;
  readonly index: number;
}

export function heldFocus(list: HTMLElement, order: readonly HTMLElement[]): HeldFocus | undefined {
  const active = list.ownerDocument.activeElement;
  if (!(active instanceof HTMLElement) || !list.contains(active)) return undefined;
  return { element: active, index: order.indexOf(active) };
}

/** What to restore focus from: where it was, and the options now listed in order. */
export interface KeptFocus {
  readonly held: HeldFocus | undefined;
  readonly order: readonly HTMLElement[];
}

/**
 * Keeps focus in the list through a re-render: on the same option (a move may have blurred it),
 * else on the one now at its position. Focus outside the list is never taken.
 */
export function keepFocus(roving: Roving, { held, order }: KeptFocus): void {
  if (!held) return;
  const target = held.element.isConnected
    ? held.element
    : order[Math.min(held.index, order.length - 1)];
  if (!target || target.ownerDocument.activeElement === target) return;
  roving.stopAt(target);
  roving.refocus(target);
}
