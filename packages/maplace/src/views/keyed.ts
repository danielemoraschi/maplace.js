/**
 * Puts exactly `ordered` into `container`, in that order: elements no longer wanted are removed,
 * the rest are moved, never re-created, so each keeps its state. `moveBefore` keeps focus
 * through a move where the browser has it; elsewhere a move blurs, and the list refocuses by key.
 */
export function reconcile(container: Element, ordered: readonly Element[]): void {
  const wanted = new Set(ordered);
  for (const element of Array.from(container.children)) {
    if (!wanted.has(element)) element.remove();
  }
  let cursor = container.firstElementChild;
  for (const element of ordered) {
    if (element === cursor) cursor = cursor.nextElementSibling;
    else place(container, element, cursor);
  }
}

type MovingContainer = Element & { moveBefore?: (node: Node, child: Node | null) => void };

function place(container: MovingContainer, element: Element, before: Element | null): void {
  if (
    container.moveBefore &&
    element.isConnected &&
    element.ownerDocument === container.ownerDocument
  ) {
    container.moveBefore(element, before);
  } else if (before) {
    before.before(element);
  } else {
    container.append(element);
  }
}
