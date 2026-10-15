/** A `<div>` with these attributes, standing for the element that reads them. */
export function elementWith(attributes: Record<string, string>): HTMLElement {
  const element = document.createElement("div");
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  return element;
}
