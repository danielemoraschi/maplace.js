import { activeElementAround } from "./active-element";

/**
 * Puts exactly `ordered` into `container`, in that order: elements no longer wanted are removed,
 * the rest are moved, never re-created, so each keeps its state. The child holding focus stays
 * put and the others move around it: a move would blur it where the browser has no `moveBefore`.
 */
export function reconcile(container: Element, ordered: readonly Element[]): void {
  const wanted = new Set(ordered);
  for (const element of Array.from(container.children)) {
    if (!wanted.has(element)) element.remove();
  }
  const focused = childHoldingFocus(container);
  let cursor = container.firstElementChild;
  for (const element of ordered) {
    if (element === cursor || element === focused) cursor = element.nextElementSibling;
    else place(container, element, cursor);
  }
}

/** The child of `container` that is, or contains, the focused element. */
function childHoldingFocus(container: Element): Element | undefined {
  let element = activeElementAround(container);
  while (element && element.parentElement !== container) element = element.parentElement;
  return element ?? undefined;
}

type MovingContainer = Element & { moveBefore?: (node: Node, child: Node | null) => void };

function place(container: MovingContainer, element: Element, before: Element | null): void {
  if (container.moveBefore && bothOnOnePage(element, container)) {
    container.moveBefore(element, before);
  } else if (before) {
    before.before(element);
  } else {
    container.append(element);
  }
}

/** `moveBefore` moves only between nodes on the same page: never into a detached container. */
function bothOnOnePage(element: Element, container: Element): boolean {
  return (
    element.isConnected &&
    container.isConnected &&
    element.ownerDocument === container.ownerDocument
  );
}
