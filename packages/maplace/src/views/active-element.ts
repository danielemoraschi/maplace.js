/**
 * The focused element in `node`'s document, or in its shadow root when the node is inside one;
 * null for a node not on the page, whose root is its own top element.
 */
export function activeElementAround(node: Node): Element | null {
  return (node.getRootNode() as Partial<DocumentOrShadowRoot>).activeElement ?? null;
}

/** Whether `element` is the focused one, in its document or shadow root. */
export function isFocused(element: Element): boolean {
  return activeElementAround(element) === element;
}
