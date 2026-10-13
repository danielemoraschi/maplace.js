/** The focused element in `node`'s document, or in its shadow root when the node is inside one. */
export function activeElementAround(node: Node): Element | null {
  return (node.getRootNode() as Document | ShadowRoot).activeElement;
}
