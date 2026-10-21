/** A new element filling the container, where a map goes. */
export function elementFilling(container: HTMLElement): HTMLElement {
  const element = container.ownerDocument.createElement("div");
  element.style.width = "100%";
  element.style.height = "100%";
  container.append(element);
  return element;
}
