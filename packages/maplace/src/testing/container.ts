import { MAP_SIZE } from "./map-probe";

/** An element as far as `attach` checks one and adds to it, so tests run without a DOM. */
export const CONTAINER = {
  nodeType: 1,
  ownerDocument: {
    createElement: () => ({
      style: {},
      setAttribute() {},
      addEventListener() {},
      append() {},
      remove() {},
    }),
  },
  prepend() {},
  append() {},
  getRootNode: () => ({ activeElement: null }),
} as unknown as HTMLElement;

/** A real map container of `size`, `MAP_SIZE` unless given, on the page. */
export function sizedContainer(size: typeof MAP_SIZE = MAP_SIZE): HTMLElement {
  const container = document.createElement("div");
  container.style.width = `${size.width}px`;
  container.style.height = `${size.height}px`;
  document.body.append(container);
  return container;
}

/** An open shadow root on a page cleared for it, as a page's own component would hold a list. */
export function shadowRootOnPage(): ShadowRoot {
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  return host.attachShadow({ mode: "open" });
}
