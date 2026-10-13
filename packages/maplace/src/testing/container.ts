import { MAP_SIZE } from "./map-probe";

/** An element as far as `attach` checks one, so tests run without a DOM. */
export const CONTAINER = { nodeType: 1 } as HTMLElement;

/** A real map container of `MAP_SIZE`, on the page. */
export function sizedContainer(): HTMLElement {
  const container = document.createElement("div");
  container.style.width = `${MAP_SIZE.width}px`;
  container.style.height = `${MAP_SIZE.height}px`;
  document.body.append(container);
  return container;
}
